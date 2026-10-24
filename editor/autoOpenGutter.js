const vscode = require('vscode');
const { OPEN_WITH_COMMAND, VIEW_TYPE } = require('./constants');
const { openGutterPanel, getGutterPanel } = require('./gutterPanel');
const { isMarkdownUri } = require('./activeMarkdownUri');
const { closeMarkdownTabsForUri } = require('./closeTextTabs');

const inflight = new Set();

function isCursorHost() {
  return /cursor/i.test(vscode.env.appName);
}

function shouldAutoOpen() {
  const config = vscode.workspace.getConfiguration('mdPreviewGutter');
  if (!config.get('autoOpenOnTextEditor', true)) {
    return false;
  }
  if (isCursorHost()) {
    return false;
  }
  return config.get('forceAutoOpen', false);
}

async function runGutterOpen(context, provider, uri) {
  const existing = getGutterPanel(uri);
  if (existing) {
    existing.reveal(vscode.ViewColumn.Active);
    return;
  }
  await openGutterPanel(context, provider, uri);
}

function scheduleOpenGutter(context, provider, uri) {
  if (!shouldAutoOpen() || !isMarkdownUri(uri)) {
    return;
  }
  const key = uri.toString();
  if (inflight.has(key)) {
    return;
  }
  inflight.add(key);
  setTimeout(() => {
    inflight.delete(key);
    void runGutterOpen(context, provider, uri).catch((error) => {
      vscode.window.showErrorMessage(`Markdown Preview Gutter: ${error}`);
    });
  }, 80);
}

function registerAutoOpenGutter(context, provider) {
  const fromEditor = (editor) => {
    if (!editor || editor.document.isUntitled || editor.document.languageId !== 'markdown') {
      return;
    }
    scheduleOpenGutter(context, provider, editor.document.uri);
  };

  context.subscriptions.push(vscode.window.onDidChangeActiveTextEditor(fromEditor));
  if (vscode.window.activeTextEditor) {
    fromEditor(vscode.window.activeTextEditor);
  }
}

module.exports = { registerAutoOpenGutter };
