const vscode = require('vscode');
const { VIEW_TYPE } = require('./constants');
const { rememberLine, revealOpenPanel } = require('./lineBus');

async function openAtLine(payload) {
  if (!payload || !payload.fsPath) {
    return;
  }
  rememberLine(payload.fsPath, payload.line);
  if (revealOpenPanel(payload.fsPath, payload.line)) {
    return;
  }
  await vscode.commands.executeCommand('vscode.openWith', vscode.Uri.file(payload.fsPath), VIEW_TYPE);
}

module.exports = { openAtLine };
