const vscode = require('vscode');
const { VIEW_TYPE } = require('./editor/constants');
const { PreviewEditorProvider } = require('./editor/previewEditor');

function activate(context) {
  try {
    registerProvider(context);
  } catch (error) {
    vscode.window.showErrorMessage(`Markdown Preview Gutter failed to activate: ${error}`);
  }
}

function registerProvider(context) {
  const provider = new PreviewEditorProvider(context);
  context.subscriptions.push(
    vscode.window.registerCustomEditorProvider(VIEW_TYPE, provider, {
      webviewOptions: { retainContextWhenHidden: true },
      supportsMultipleEditorsPerDocument: false,
    })
  );
  context.subscriptions.push(
    vscode.commands.registerCommand('mdPreviewGutter.open', () => openGutterPreview())
  );
}

function openGutterPreview() {
  const uri = vscode.window.activeTextEditor?.document.uri ?? vscode.window.tabGroups.activeTabGroup.activeTab?.input?.uri;
  if (!uri) {
    return;
  }
  vscode.commands.executeCommand('vscode.openWith', uri, VIEW_TYPE);
}

module.exports = { activate };
