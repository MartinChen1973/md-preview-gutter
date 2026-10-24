const vscode = require('vscode');
const { siblingFsPath } = require('./resolvePreviewHref');

const LINE_LINK_RE = /(?<!!)\[L(\d+)\]\(([^)\s#]+)#L(\d+)\)/g;
const COMMAND_OPEN_AT_LINE = 'mdPreviewGutter.openAtLine';
const MARKDOWN_SELECTOR = { language: 'markdown', scheme: 'file', pattern: '**/*' };

function registerLineLinks(context) {
  context.subscriptions.push(
    vscode.languages.registerDocumentLinkProvider(MARKDOWN_SELECTOR, {
      provideDocumentLinks,
    })
  );
}

function provideDocumentLinks(document) {
  const links = [];
  for (let line = 0; line < document.lineCount; line += 1) {
    collectLineLinks(document, line, links);
  }
  return links;
}

function collectLineLinks(document, line, links) {
  const text = document.lineAt(line).text;
  LINE_LINK_RE.lastIndex = 0;
  let match = LINE_LINK_RE.exec(text);
  while (match) {
    const link = linkForMatch(document, line, match);
    if (link) {
      links.push(link);
    }
    match = LINE_LINK_RE.exec(text);
  }
}

function linkForMatch(document, line, match) {
  if (match[1] !== match[3]) {
    return undefined;
  }
  const uri = targetUri(document, match[2]);
  if (!uri) {
    return undefined;
  }
  const payload = { fsPath: uri.fsPath, line: Number(match[1]) };
  const target = vscode.Uri.parse(
    `command:${COMMAND_OPEN_AT_LINE}?${encodeURIComponent(JSON.stringify(payload))}`
  );
  return new vscode.DocumentLink(
    new vscode.Range(line, match.index, line, match.index + match[0].length),
    target
  );
}

function targetUri(document, rawPath) {
  const fsPath = siblingFsPath(document.uri.fsPath, rawPath);
  if (!fsPath) {
    return undefined;
  }
  return vscode.Uri.file(fsPath);
}

module.exports = { COMMAND_OPEN_AT_LINE, registerLineLinks };
