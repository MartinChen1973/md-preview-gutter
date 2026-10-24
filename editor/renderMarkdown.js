const MarkdownIt = require('markdown-it');
const {
  LINE_ATTR,
  CODE_LINE_CLASS,
  TOKEN_OPEN_NESTING,
  HTML_TRUE,
  LINKIFY_TRUE,
  TYPOGRAPHER_FALSE,
} = require('./constants');

const UNSAFE_LINK_RE = /^(javascript|vbscript|data):/i;

function attachLineAttr(token) {
  if (!token.map || token.nesting !== TOKEN_OPEN_NESTING) {
    return;
  }
  token.attrSet(LINE_ATTR, String(token.map[0]));
  token.attrJoin('class', CODE_LINE_CLASS);
}

function sourceLinePlugin(md) {
  md.core.ruler.push('mdPreviewGutterSourceLines', (state) => {
    for (const token of state.tokens) {
      attachLineAttr(token);
    }
  });
}

function createEngine() {
  const md = new MarkdownIt({
    html: HTML_TRUE,
    linkify: LINKIFY_TRUE,
    typographer: TYPOGRAPHER_FALSE,
  });
  md.use(sourceLinePlugin);
  md.validateLink = (url) => !UNSAFE_LINK_RE.test(url);
  tryAttachTables(md);
  return md;
}

function tryAttachTables(md) {
  try {
    md.use(require('markdown-it-multimd-table'));
  } catch (_error) {
    return;
  }
}

const engine = createEngine();

function renderMarkdown(text) {
  return engine.render(text ?? '');
}

module.exports = { renderMarkdown };
