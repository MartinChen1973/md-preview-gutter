const vscode = require('vscode');
const {
  COMMAND_OPEN,
  COMMAND_SHOW_PREVIEW,
  COMMAND_SHOW_SOURCE,
  MODE_PREVIEW,
  MODE_SOURCE,
  RETAIN_CONTEXT_WHEN_HIDDEN,
  SUPPORTS_MULTIPLE_EDITORS,
  VIEW_TYPE,
} = require('./editor/constants');
const { PreviewEditorProvider } = require('./editor/previewEditor');
const { openAtLine } = require('./editor/openAtLine');
const { COMMAND_OPEN_AT_LINE, registerLineLinks } = require('./editor/lineLinks');
const { openGutterPreview, registerGutterOpeners } = require('./editor/openGutterPreview');
const { registerAutoOpenGutter } = require('./editor/autoOpenGutter');
const { registerCursorMarkdownTabs } = require('./editor/cursorMarkdownTabs');
const { attachSourceLineRuler } = require('./extendMarkdownIt');

function useCustomEditor() {
  return vscode.workspace.getConfiguration('mdPreviewGutter').get('useCustomEditor', false);
}

function previewPlacement() {
  return vscode.workspace.getConfiguration('mdPreviewGutter').get('previewPlacement', 'main');
}

function syncEditorContext() {
  return vscode.commands.executeCommand(
    'setContext',
    'mdPreviewGutter.customEditorEnabled',
    useCustomEditor()
  );
}

function activate(context) {
  const openSidePreview = registerSidePreviewCommands(context);
  context.subscriptions.push(
    vscode.commands.registerCommand('mdPreviewGutter.openPanel', (resource) => {
      void openGutterPreview(resource);
    })
  );
  let panelProvider;
  try {
    panelProvider = new PreviewEditorProvider(context);
    registerGutterOpeners(context, panelProvider);
    void syncEditorContext();
    context.subscriptions.push(
      vscode.workspace.onDidChangeConfiguration((event) => {
        if (event.affectsConfiguration('mdPreviewGutter.useCustomEditor')) {
          void syncEditorContext();
        }
      })
    );
    if (useCustomEditor() && panelProvider) {
      registerProvider(context, panelProvider);
      registerCursorMarkdownTabs(context, panelProvider);
      registerAutoOpenGutter(context, panelProvider);
    }
  } catch (error) {
    vscode.window.showErrorMessage(`Markdown Preview Gutter failed to activate: ${error}`);
  }

  return {
    extendMarkdownIt(md) {
      return attachSourceLineRuler(md);
    },
  };
}

function isMarkdownFileUri(uri) {
  return /\.(md|markdown)$/i.test(uri.fsPath || uri.path);
}

function markdownUrisFromOpenTabs() {
  const seen = new Set();
  const uris = [];
  for (const group of vscode.window.tabGroups.all) {
    for (const tab of group.tabs) {
      const input = tab.input;
      let uri;
      if (input instanceof vscode.TabInputText) {
        uri = input.uri;
      } else if (input instanceof vscode.TabInputCustom && isMarkdownFileUri(input.uri)) {
        uri = input.uri;
      }
      if (!uri || !isMarkdownFileUri(uri)) {
        continue;
      }
      const key = uri.toString();
      if (seen.has(key)) {
        continue;
      }
      seen.add(key);
      uris.push(uri);
    }
  }
  return uris;
}

function activeMarkdownUri() {
  const active = vscode.window.activeTextEditor;
  if (active?.document.languageId === 'markdown') {
    return active.document.uri;
  }
  for (const editor of vscode.window.visibleTextEditors) {
    if (editor.document.languageId === 'markdown') {
      return editor.document.uri;
    }
  }
  const tabUris = markdownUrisFromOpenTabs();
  if (tabUris.length === 1) {
    return tabUris[0];
  }
  if (tabUris.length > 1) {
    const activeTab = vscode.window.tabGroups.activeTabGroup.activeTab;
    const activeUri = activeTab?.input instanceof vscode.TabInputText ? activeTab.input.uri : undefined;
    if (activeUri) {
      const previewSibling = tabUris.find((uri) => uri.toString() !== activeUri.toString());
      if (previewSibling) {
        return previewSibling;
      }
    }
    return tabUris[0];
  }
  const openDocs = vscode.workspace.textDocuments.filter((doc) => doc.languageId === 'markdown');
  if (openDocs.length === 1) {
    return openDocs[0].uri;
  }
  return openDocs[0]?.uri;
}

const BUILTIN_PREVIEW_EDITOR = 'vscode.markdown.preview.editor';

async function leaveBuiltinPreviewEditor() {
  const activeTab = vscode.window.tabGroups.activeTabGroup.activeTab;
  const input = activeTab?.input;
  if (input instanceof vscode.TabInputCustom && input.viewType === BUILTIN_PREVIEW_EDITOR) {
    await vscode.commands.executeCommand('markdown.showSource');
  }
}

async function ensureMarkdownSourceVisible(uri) {
  const editor = vscode.window.activeTextEditor;
  if (!editor || editor.document.uri.toString() !== uri.toString()) {
    await vscode.window.showTextDocument(uri, { preview: false, preserveFocus: false });
  }
}

async function openBuiltInPreviewWithGutter(uri) {
  await leaveBuiltinPreviewEditor();
  await ensureMarkdownSourceVisible(uri);
  if (previewPlacement() === 'side') {
    await vscode.commands.executeCommand('markdown.showPreviewToSide', uri);
  } else {
    await vscode.commands.executeCommand('markdown.showPreview', uri);
  }
  await vscode.commands.executeCommand('markdown.preview.refresh');
}

function registerSidePreviewCommands(context) {
  const openSidePreview = async () => {
    const uri = activeMarkdownUri();
    if (!uri) {
      await vscode.window.showWarningMessage(
        'Open a Markdown file in the editor, click its source tab, then run side preview again.'
      );
      return;
    }
    await openBuiltInPreviewWithGutter(uri);
  };
  const openMainPreview = async () => {
    const uri = activeMarkdownUri();
    if (!uri) {
      await vscode.window.showWarningMessage(
        'Open a Markdown file in the editor, click its source tab, then run preview again.'
      );
      return;
    }
    await leaveBuiltinPreviewEditor();
    await ensureMarkdownSourceVisible(uri);
    await vscode.commands.executeCommand('markdown.showPreview', uri);
    await vscode.commands.executeCommand('markdown.preview.refresh');
  };
  context.subscriptions.push(
    vscode.commands.registerCommand('mdPreviewGutter.openSidePreview', () => {
      void openSidePreview();
    }),
    vscode.commands.registerCommand('mdPreviewGutter.openMainPreview', () => {
      void openMainPreview();
    })
  );
  if (!useCustomEditor()) {
    context.subscriptions.push(
      vscode.commands.registerCommand(COMMAND_OPEN, () => {
        void openSidePreview();
      })
    );
  }
  return openSidePreview;
}

function registerProvider(context, provider) {
  context.subscriptions.push(
    vscode.window.registerCustomEditorProvider(VIEW_TYPE, provider, {
      webviewOptions: { retainContextWhenHidden: RETAIN_CONTEXT_WHEN_HIDDEN },
      supportsMultipleEditorsPerDocument: SUPPORTS_MULTIPLE_EDITORS,
    })
  );
  registerCommands(context, provider);
  registerLineLinks(context);
  return provider;
}

function registerCommands(context, provider) {
  const commands = {
    [COMMAND_OPEN]: () => {
      void openGutterPreview();
    },
    [COMMAND_SHOW_PREVIEW]: () => provider.setActiveMode(MODE_PREVIEW),
    [COMMAND_SHOW_SOURCE]: () => provider.setActiveMode(MODE_SOURCE),
    [COMMAND_OPEN_AT_LINE]: (payload) => openAtLine(payload),
  };
  for (const [name, handler] of Object.entries(commands)) {
    context.subscriptions.push(vscode.commands.registerCommand(name, handler));
  }
}

module.exports = { activate };
