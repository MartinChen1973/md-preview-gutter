const vscode = require('vscode');
const {
  CONTEXT_MODE,
  ENABLE_SCRIPTS,
  MESSAGE_EDIT,
  MESSAGE_INIT,
  MESSAGE_READY,
  MESSAGE_OPEN_LINK,
  MESSAGE_SET_MODE,
  MESSAGE_UPDATE,
  MODE_PREVIEW,
  SET_CONTEXT_COMMAND,
} = require('./constants');
const {
  backupGutterDocument,
  openGutterDocument,
  revertGutterDocument,
  saveGutterDocument,
  saveGutterDocumentAs,
} = require('./gutterDocument');
const { renderMarkdown } = require('./renderMarkdown');
const { buildWebviewHtml } = require('./webviewHtml');
const { openPreviewHref } = require('./openPreviewLink');
const { rewriteRelativeHrefs } = require('./resolvePreviewHref');
const { registerPanel, unregisterPanel, takeLine } = require('./lineBus');

class PreviewEditorProvider {
  constructor(context) {
    this.context = context;
    this.updatingFromWebview = false;
    this.panelState = new Map();
    this._onDidChangeCustomDocument = new vscode.EventEmitter();
    this.onDidChangeCustomDocument = this._onDidChangeCustomDocument.event;
    context.subscriptions.push(this._onDidChangeCustomDocument);
  }

  async openCustomDocument(uri) {
    return openGutterDocument(uri);
  }

  async resolveCustomEditor(document, webviewPanel) {
    try {
      this.attachWebview(document, webviewPanel);
    } catch (error) {
      vscode.window.showErrorMessage(`Markdown Preview Gutter failed to open: ${error}`);
    }
  }

  async saveCustomDocument(document) {
    await saveGutterDocument(document);
  }

  async saveCustomDocumentAs(document, destination) {
    await saveGutterDocumentAs(document, destination);
  }

  async revertCustomDocument(document) {
    await revertGutterDocument(document);
  }

  async backupCustomDocument(document, context) {
    return backupGutterDocument(document, context);
  }

  attachWebview(document, webviewPanel) {
    webviewPanel.webview.options = {
      enableScripts: ENABLE_SCRIPTS,
      localResourceRoots: this.resourceRoots(document.uri),
    };
    webviewPanel.webview.html = buildWebviewHtml(
      webviewPanel.webview,
      this.context.extensionUri
    );
    this.bindWebview(document, webviewPanel);
  }

  resourceRoots(resourceUri) {
    const roots = [this.context.extensionUri];
    const folder = this.documentFolder(resourceUri);
    if (!folder) {
      return roots;
    }
    roots.push(folder);
    return roots;
  }

  documentFolder(resourceUri) {
    const fsPath = resourceUri.fsPath;
    if (!fsPath) {
      return undefined;
    }
    return vscode.Uri.file(require('path').dirname(fsPath));
  }

  bindWebview(document, webviewPanel) {
    const textDocument = document.textDocument;
    this.panelState.set(webviewPanel, { mode: MODE_PREVIEW, document });
    registerPanel(document.uri.fsPath, webviewPanel);
    this.syncContext(MODE_PREVIEW);
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
      this.onDocumentChanged(event, textDocument, sendUpdate);
    });
    webviewPanel.onDidChangeViewState(() => {
      this.onViewStateChanged(webviewPanel);
    });
    webviewPanel.onDidDispose(() => {
      this.disposePanel(webviewPanel, changeSub);
    });
  }

  disposePanel(webviewPanel, changeSub) {
    changeSub.dispose();
    const state = this.panelState.get(webviewPanel);
    if (state?.document?.uri) {
      unregisterPanel(state.document.uri.fsPath, webviewPanel);
    }
    this.panelState.delete(webviewPanel);
  }

  onViewStateChanged(webviewPanel) {
    if (!webviewPanel.active) {
      return;
    }
    this.syncContext(this.modeFor(webviewPanel));
  }

  setActiveMode(mode) {
    const panel = this.activePanel();
    if (!panel) {
      return;
    }
    const current = this.panelState.get(panel);
    this.panelState.set(panel, { ...current, mode });
    panel.webview.postMessage({ type: MESSAGE_SET_MODE, mode });
    this.syncContext(mode);
  }

  activePanel() {
    for (const panel of this.panelState.keys()) {
      if (panel.active) {
        return panel;
      }
    }
    return undefined;
  }

  modeFor(webviewPanel) {
    return this.panelState.get(webviewPanel)?.mode ?? MODE_PREVIEW;
  }

  syncContext(mode) {
    vscode.commands.executeCommand(SET_CONTEXT_COMMAND, CONTEXT_MODE, mode);
  }

  handleMessage(message, document, sendInit) {
    const handlers = {
      [MESSAGE_READY]: sendInit,
      [MESSAGE_EDIT]: () => this.applyEdit(document, message.text),
      [MESSAGE_OPEN_LINK]: () => openPreviewHref(document.uri, message.href),
    };
    handlers[message.type]?.();
  }

  onDocumentChanged(event, textDocument, sendUpdate) {
    if (event.document.uri.toString() !== textDocument.uri.toString()) {
      return;
    }
    if (this.updatingFromWebview) {
      return;
    }
    sendUpdate();
  }

  postSnapshot(webviewPanel, document, type) {
    const textDocument = document.textDocument;
    const text = textDocument.getText();
    const payload = {
      type,
      text,
      html: rewriteRelativeHrefs(
        this.rewriteMedia(renderMarkdown(text), document.uri, webviewPanel.webview),
        document.uri.fsPath
      ),
    };
    if (type === MESSAGE_INIT) {
      payload.mode = this.modeFor(webviewPanel);
      payload.line = takeLine(document.uri.fsPath);
    }
    webviewPanel.webview.postMessage(payload);
  }

  rewriteMedia(html, resourceUri, webview) {
    const folder = vscode.Uri.joinPath(resourceUri, '..');
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
    const textDocument = document.textDocument;
    if (text === textDocument.getText()) {
      return;
    }
    this.updatingFromWebview = true;
    const edit = new vscode.WorkspaceEdit();
    const fullRange = new vscode.Range(
      textDocument.positionAt(0),
      textDocument.positionAt(textDocument.getText().length)
    );
    edit.replace(textDocument.uri, fullRange, text);
    vscode.workspace.applyEdit(edit).then(() => {
      this.updatingFromWebview = false;
      this._onDidChangeCustomDocument.fire({ document });
    });
  }
}

module.exports = { PreviewEditorProvider };
