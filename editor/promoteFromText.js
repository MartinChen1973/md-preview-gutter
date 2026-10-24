const vscode = require('vscode');
const { openGutterPreviewForUri } = require('./openGutterPreview');

const promotedThisSession = new Set();

function pathMatchesGlobs(relPath, globs) {
  const norm = relPath.replace(/\\/g, '/');
  return globs.some((glob) => {
    const g = String(glob).replace(/\\/g, '/');
    if (g.includes('**')) {
      const needle = g.split('**').join('').replace(/\*/g, '');
      return norm.includes(needle);
    }
    return norm.endsWith(g.replace(/^\*/, ''));
  });
}

function registerPromoteFromText(context) {
  const schedulePromote = (editor) => {
    if (!editor || editor.document.isUntitled || editor.document.languageId !== 'markdown') {
      return;
    }
    const config = vscode.workspace.getConfiguration('mdPreviewGutter');
    if (!config.get('promoteFromTextEditor', true)) {
      return;
    }
    const globs = config.get('promoteFromTextGlobs', ['**/docs/shares/**']);
    const rel = vscode.workspace.asRelativePath(editor.document.uri);
    if (!pathMatchesGlobs(rel, globs)) {
      return;
    }
    const key = editor.document.uri.toString();
    if (promotedThisSession.has(key)) {
      return;
    }
    promotedThisSession.add(key);
    setTimeout(() => {
      void openGutterPreviewForUri(editor.document.uri).catch(() => {
        promotedThisSession.delete(key);
      });
    }, 120);
  };

  context.subscriptions.push(vscode.window.onDidChangeActiveTextEditor(schedulePromote));
  if (vscode.window.activeTextEditor) {
    schedulePromote(vscode.window.activeTextEditor);
  }
}

module.exports = { registerPromoteFromText };
