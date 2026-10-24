const vscode = require('vscode');
const { PANEL_VIEW_TYPE } = require('./gutterPanel');

function uriFromTab(tab) {
  const input = tab.input;
  if (!input || typeof input !== 'object') {
    return undefined;
  }
  if ('uri' in input && input.uri) {
    return input.uri;
  }
  return undefined;
}

function isGutterPanelTab(tab) {
  const input = tab.input;
  return input instanceof vscode.TabInputWebview && input.viewType === PANEL_VIEW_TYPE;
}

async function closeMarkdownTabsForUri(uri, keepGutterPanel) {
  const key = uri.toString();
  const toClose = [];
  for (const group of vscode.window.tabGroups.all) {
    for (const tab of group.tabs) {
      if (keepGutterPanel && isGutterPanelTab(tab)) {
        continue;
      }
      const tabUri = uriFromTab(tab);
      if (tabUri && tabUri.toString() === key) {
        toClose.push(tab);
      }
    }
  }
  if (toClose.length === 0) {
    return;
  }
  await vscode.window.tabGroups.close(toClose);
}

module.exports = { closeMarkdownTabsForUri, uriFromTab, isGutterPanelTab };
