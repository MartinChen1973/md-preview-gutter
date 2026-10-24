const vscode = require('vscode');
const { OPEN_WITH_COMMAND, VIEW_TYPE } = require('./constants');
const { getActiveMarkdownUri, isMarkdownUri } = require('./activeMarkdownUri');

let panelOpener;

function registerGutterOpeners(context, provider) {
  const { openGutterPanel } = require('./gutterPanel');
  panelOpener = (uri) => openGutterPanel(context, provider, uri);
}

function isCursorHost() {
  return /cursor/i.test(vscode.env.appName);
}

async function openGutterPreviewForUri(uri) {
  if (!isMarkdownUri(uri)) {
    return;
  }
  if (isCursorHost() && panelOpener) {
    await panelOpener(uri);
    return;
  }
  await vscode.commands.executeCommand(OPEN_WITH_COMMAND, uri, VIEW_TYPE, {
    preview: false,
  });
}

async function openGutterPreview(resourceUri) {
  const uri = resourceUri ?? getActiveMarkdownUri();
  if (!uri) {
    vscode.window.showWarningMessage(
      'Markdown Preview Gutter: focus a Markdown (.md) tab first, then run this command again.'
    );
    return;
  }
  try {
    await openGutterPreviewForUri(uri);
  } catch (error) {
    vscode.window.showErrorMessage(`Markdown Preview Gutter could not open: ${error}`);
  }
}

module.exports = { openGutterPreview, openGutterPreviewForUri, registerGutterOpeners };
