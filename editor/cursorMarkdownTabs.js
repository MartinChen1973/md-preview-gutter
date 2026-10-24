const vscode = require('vscode');
const { isMarkdownUri } = require('./activeMarkdownUri');
const { openGutterPanel, getGutterPanel, PANEL_VIEW_TYPE } = require('./gutterPanel');
const { closeMarkdownTabsForUri, uriFromTab, isGutterPanelTab } = require('./closeTextTabs');

const inflight = new Set();

function isCursorHost() {
  return /cursor/i.test(vscode.env.appName);
}

function shouldRun() {
  if (!isCursorHost()) {
    return false;
  }
  return vscode.workspace.getConfiguration('mdPreviewGutter').get('autoOpenOnTextEditor', true);
}

function shouldCloseOtherTabs() {
  return vscode.workspace.getConfiguration('mdPreviewGutter').get('closeTextTabAfterPanel', true);
}

async function openGutterForMarkdownUri(context, provider, uri) {
  const existing = getGutterPanel(uri);
  if (existing) {
    existing.reveal(vscode.ViewColumn.Active);
  } else {
    await openGutterPanel(context, provider, uri);
  }
  if (shouldCloseOtherTabs()) {
    await closeMarkdownTabsForUri(uri, true);
  }
}

function scheduleFromUri(context, provider, uri) {
  if (!shouldRun() || !isMarkdownUri(uri)) {
    return;
  }
  const key = uri.toString();
  if (inflight.has(key)) {
    return;
  }
  inflight.add(key);
  setTimeout(() => {
    inflight.delete(key);
    void openGutterForMarkdownUri(context, provider, uri).catch((error) => {
      vscode.window.showErrorMessage(`Markdown Preview Gutter: ${error}`);
    });
  }, 0);
}

function registerCursorMarkdownTabs(context, provider) {
  if (!isCursorHost()) {
    return;
  }

  const onTab = (tab) => {
    if (isGutterPanelTab(tab)) {
      return;
    }
    const uri = uriFromTab(tab);
    if (uri) {
      scheduleFromUri(context, provider, uri);
    }
  };

  context.subscriptions.push(
    vscode.window.tabGroups.onDidChangeTabs((event) => {
      for (const tab of event.opened) {
        onTab(tab);
      }
    })
  );

  for (const group of vscode.window.tabGroups.all) {
    for (const tab of group.tabs) {
      onTab(tab);
    }
  }
}

module.exports = { registerCursorMarkdownTabs, PANEL_VIEW_TYPE };
