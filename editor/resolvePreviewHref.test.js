const assert = require('assert');
const { resolvePreviewHref, rewriteRelativeHrefs } = require('./resolvePreviewHref');

const DOC = 'C:\\Projects\\Seai\\vscode-seai-extension\\test\\memo-to-seai\\note.seai.md';
const MEMO = 'C:\\Projects\\Seai\\vscode-seai-extension\\test\\memo-to-seai\\meeting-memo.md';

function fsOf(href) {
  return resolvePreviewHref(DOC, href).fsPath;
}

assert.strictEqual(fsOf('./meeting-memo.md#L20'), MEMO);
assert.strictEqual(resolvePreviewHref(DOC, './meeting-memo.md#L20').line, 20);
assert.strictEqual(fsOf('meeting-memo.md#L14'), MEMO);
assert.strictEqual(fsOf('file:///meeting-memo.md#L20'), MEMO);
assert.strictEqual(fsOf('file:///./meeting-memo.md#L20'), MEMO);
assert.strictEqual(
  fsOf('file:///C:/other/meeting-memo.md#L14'),
  'C:\\other\\meeting-memo.md'
);
assert.strictEqual(resolvePreviewHref(DOC, '#附录'), undefined);
assert.strictEqual(
  resolvePreviewHref(DOC, 'https://example.com/a').external,
  'https://example.com/a'
);

const html = rewriteRelativeHrefs('<a href="./meeting-memo.md#L20">L20</a>', DOC);
assert.ok(html.includes('href="file:///C:/Projects/Seai/vscode-seai-extension/test/memo-to-seai/meeting-memo.md#L20"'));
assert.ok(html.includes('data-memo-href="file:///C:/Projects/Seai/vscode-seai-extension/test/memo-to-seai/meeting-memo.md#L20"'));
assert.ok(!html.includes('href="./meeting-memo.md'));

console.log('resolvePreviewHref ok');
