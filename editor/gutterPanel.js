const path = require('path');
const vscode = require('vscode');
const { GutterDocument } = require('./gutterDocument');
const { buildWebviewHtml } = require('./webviewHtml');
const { ENABLE_SCRIPTS } = require('./constants');

const PANEL_VIEW_TYPE = 'mdPreviewGutter.panel';
const PANEL_COLUMN = vscode.ViewColumn.Beside;
const panelsByUri = new Map();

async function loadPanelDocument(resourceUri) {
  const bytes = await vscode.workspace.fs.readFile(resourceUri);
  const text = new TextDecoder().decode(bytes);
  const textDocument = await vscode.workspace.openTextDocument({
    language: 'markdown',
    content: text,
  });
  return new GutterDocument(resourceUri, textDocument);
}

async function openGutterPanel(context, provider, resourceUri) {
  const key = resourceUri.toString();
  const existing = panelsByUri.get(key);
  if (existing) {
    existing.reveal(PANEL_COLUMN, true);
    return;
  }

  const document = await loadPanelDocument(resourceUri);
  const panel = vscode.window.createWebviewPanel(
    PANEL_VIEW_TYPE,
    path.basename(resourceUri.fsPath),
    PANEL_COLUMN,
    {
      enableScripts: ENABLE_SCRIPTS,
      retainContextWhenHidden: true,
      localResourceRoots: provider.resourceRoots(resourceUri),
    }
  );
  panelsByUri.set(key, panel);
  panel.webview.html = buildWebviewHtml(panel.webview, context.extensionUri);
  provider.attachWebview(document, panel);
  panel.onDidDispose(() => {
    panelsByUri.delete(key);
  });
}

function getGutterPanel(resourceUri) {
  return panelsByUri.get(resourceUri.toString());
}

module.exports = { openGutterPanel, getGutterPanel, PANEL_VIEW_TYPE };
