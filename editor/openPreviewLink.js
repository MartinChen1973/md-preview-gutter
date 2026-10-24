const vscode = require('vscode');
const { openAtLine } = require('./openAtLine');
const { openLine, resolvePreviewHref } = require('./resolvePreviewHref');

function openPreviewHref(documentUri, href) {
  const target = resolvePreviewHref(documentUri.fsPath, href);
  if (!target) {
    return undefined;
  }
  if (target.external) {
    return vscode.env.openExternal(vscode.Uri.parse(target.external));
  }
  return openAtLine({ fsPath: target.fsPath, line: openLine(target) });
}

module.exports = { openPreviewHref };
