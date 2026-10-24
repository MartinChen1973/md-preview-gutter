const path = require('path');
const vscode = require('vscode');

function isMarkdownUri(uri) {
  if (!uri || uri.scheme !== 'file') {
    return false;
  }
  const ext = path.extname(uri.fsPath).toLowerCase();
  return ext === '.md' || ext === '.markdown';
}

function getActiveMarkdownUri() {
  const editor = vscode.window.activeTextEditor;
  if (editor?.document?.uri && isMarkdownUri(editor.document.uri)) {
    return editor.document.uri;
  }

  const input = vscode.window.tabGroups.activeTabGroup.activeTab?.input;
  if (!input || typeof input !== 'object') {
    return undefined;
  }

  if ('uri' in input && isMarkdownUri(input.uri)) {
    return input.uri;
  }

  if ('modified' in input && isMarkdownUri(input.modified)) {
    return input.modified;
  }

  return undefined;
}

module.exports = { getActiveMarkdownUri, isMarkdownUri };
