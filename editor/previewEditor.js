const vscode = require('vscode');
const {
  MESSAGE_EDIT,
  MESSAGE_INIT,
  MESSAGE_READY,
  MESSAGE_UPDATE,
  MODE_PREVIEW,
} = require('./constants');
const { renderMarkdown } = require('./renderMarkdown');
const { buildWebviewHtml } = require('./webviewHtml');

class PreviewEditorProvider {
  constructor(context) {
    this.context = context;
    this.updatingFromWebview = false;
  }

  async resolveCustomTextEditor(document, webviewPanel) {
    webviewPanel.webview.options = {
      enableScripts: true,
      localResourceRoots: this.resourceRoots(document),
    };
    webviewPanel.webview.html = buildWebviewHtml(
      webviewPanel.webview,
      this.context.extensionUri
    );
    this.bindWebview(document, webviewPanel);
  }

  resourceRoots(document) {
    const roots = [this.context.extensionUri];
    const folder = this.documentFolder(document);
    if (!folder) {
      return roots;
    }
    roots.push(folder);
    return roots;
  }

  documentFolder(document) {
    const fsPath = document.uri.fsPath;
    if (!fsPath) {
      return undefined;
    }
    return vscode.Uri.file(require('path').dirname(fsPath));
  }

  bindWebview(document, webviewPanel) {
    const sendInit = () => {
      this.postSnapshot(webviewPanel, document, MESSAGE_INIT);
    };
    const sendUpdate = () => {
      this.postSnapshot(webviewPanel, document, MESSAGE_UPDATE);
    };
    webviewPanel.webview.onDidReceiveMessage((message) => {
      this.handleMessage(message, document, sendInit);
    });
    const changeSub = vscode.workspace.onDidChangeTextDocument((event) => {
      this.onDocumentChanged(event, document, sendUpdate);
    });
    webviewPanel.onDidDispose(() => changeSub.dispose());
  }

  handleMessage(message, document, sendInit) {
    const handlers = {
      [MESSAGE_READY]: sendInit,
      [MESSAGE_EDIT]: () => this.applyEdit(document, message.text),
    };
    handlers[message.type]?.();
  }

  onDocumentChanged(event, document, sendUpdate) {
    if (event.document.uri.toString() !== document.uri.toString()) {
      return;
    }
    if (this.updatingFromWebview) {
      return;
    }
    sendUpdate();
  }

  postSnapshot(webviewPanel, document, type) {
    const text = document.getText();
    const payload = {
      type,
      text,
      html: this.rewriteMedia(renderMarkdown(text), document, webviewPanel.webview),
    };
    if (type === MESSAGE_INIT) {
      payload.mode = MODE_PREVIEW;
    }
    webviewPanel.webview.postMessage(payload);
  }

  rewriteMedia(html, document, webview) {
    const folder = vscode.Uri.joinPath(document.uri, '..');
    return html.replace(/src="([^"]+)"/g, (_all, src) => this.rewriteSrc(src, folder, webview));
  }

  rewriteSrc(src, folder, webview) {
    if (/^(https?:|data:|vscode-webview:)/i.test(src)) {
      return `src="${src}"`;
    }
    const uri = vscode.Uri.joinPath(folder, src);
    return `src="${webview.asWebviewUri(uri)}"`;
  }

  applyEdit(document, text) {
    if (text === document.getText()) {
      return;
    }
    this.updatingFromWebview = true;
    const edit = new vscode.WorkspaceEdit();
    const fullRange = new vscode.Range(
      document.positionAt(0),
      document.positionAt(document.getText().length)
    );
    edit.replace(document.uri, fullRange, text);
    vscode.workspace.applyEdit(edit).then(() => {
      this.updatingFromWebview = false;
    });
  }
}

module.exports = { PreviewEditorProvider };
