const TOKEN_OPEN_NESTING = 1;
const LINE_ATTR = 'data-line';
const CODE_LINE_CLASS = 'code-line';

let rulerInstalled = false;

function attachSourceLineRuler(md) {
  if (rulerInstalled) {
    return md;
  }
  md.core.ruler.push('mdPreviewGutterSourceLines', (state) => {
    for (const token of state.tokens) {
      if (!token.map || token.nesting !== TOKEN_OPEN_NESTING) {
        continue;
      }
      token.attrSet(LINE_ATTR, String(token.map[0]));
      token.attrJoin('class', CODE_LINE_CLASS);
    }
  });
  rulerInstalled = true;
  return md;
}

module.exports = { attachSourceLineRuler };
