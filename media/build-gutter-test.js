const fs = require('fs');
const path = require('path');
const { renderMarkdown } = require('../editor/renderMarkdown');

const mdPath =
  'c:/Projects/aicoding100/AICoding100-docs/配套内训/1天 高效AI Coding的应用和实践案例/1天 高效AI Coding的应用和实践案例.md';
const css = fs.readFileSync(path.join(__dirname, 'editor.css'), 'utf8');
const body = renderMarkdown(fs.readFileSync(mdPath, 'utf8'));
const outPath = path.join(__dirname, 'gutter-test.html');

const html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <title>Gutter test</title>
  <style>
${css}
html, body { height: 100%; }
</style>
</head>
<body data-mode="preview">
  <div id="toggle-group">
    <button type="button" class="toggle-tab active">Preview</button>
  </div>
  <div id="preview-wrap">
    <div id="md-preview-gutter"></div>
    <div id="preview" class="markdown-body">${body}</div>
  </div>
  <script>
    const LINE_NUMBER_OFFSET = 1;
    const previewEl = document.getElementById('preview');
    const previewWrap = document.getElementById('preview-wrap');
    function sourceLineOf(el) {
      return Number(el.getAttribute('data-line')) + LINE_NUMBER_OFFSET;
    }
    function markTop(el) {
      return el.getBoundingClientRect().top + previewWrap.scrollTop - previewWrap.getBoundingClientRect().top;
    }
    function layout() {
      const root = document.getElementById('md-preview-gutter');
      const chosen = new Map();
      for (const el of previewEl.querySelectorAll('.code-line[data-line]')) {
        const line = sourceLineOf(el);
        if (chosen.has(line)) continue;
        chosen.set(line, el);
      }
      const frag = document.createDocumentFragment();
      for (const [line, el] of chosen) {
        const mark = document.createElement('div');
        mark.className = 'md-preview-gutter-mark';
        mark.textContent = String(line);
        mark.style.top = markTop(el) + 'px';
        frag.appendChild(mark);
      }
      root.replaceChildren(frag);
    }
    layout();
    previewWrap.addEventListener('scroll', layout);
    window.addEventListener('resize', layout);
  </script>
</body>
</html>
`;

fs.writeFileSync(outPath, html);
console.log('wrote', outPath);
