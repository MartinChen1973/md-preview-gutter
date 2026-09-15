const GUTTER_ROOT_ID = 'md-preview-gutter';
const MARK_CLASS = 'md-preview-gutter-mark';
const LINE_SELECTOR = '.code-line[data-line]';
const LINE_ATTR = 'data-line';
const LINE_NUMBER_OFFSET = 1;
const RESIZE_EVENT = 'resize';
const LOAD_EVENT = 'load';

function ensureGutterRoot() {
  const existing = document.getElementById(GUTTER_ROOT_ID);
  if (existing) {
    return existing;
  }
  const root = document.createElement('div');
  root.id = GUTTER_ROOT_ID;
  document.body.prepend(root);
  return root;
}

function sourceLineOf(element) {
  return Number(element.getAttribute(LINE_ATTR)) + LINE_NUMBER_OFFSET;
}

function markTop(element) {
  return element.getBoundingClientRect().top + window.scrollY;
}

function firstElementPerLine(elements) {
  const chosen = new Map();
  for (const element of elements) {
    const line = sourceLineOf(element);
    if (chosen.has(line)) {
      continue;
    }
    chosen.set(line, element);
  }
  return chosen;
}

function createMark(line, element) {
  const mark = document.createElement('div');
  mark.className = MARK_CLASS;
  mark.textContent = String(line);
  mark.style.top = `${markTop(element)}px`;
  return mark;
}

function renderMarks(root) {
  const chosen = firstElementPerLine(document.querySelectorAll(LINE_SELECTOR));
  const fragment = document.createDocumentFragment();
  for (const [line, element] of chosen) {
    fragment.appendChild(createMark(line, element));
  }
  root.replaceChildren(fragment);
}

function layout() {
  renderMarks(ensureGutterRoot());
}

layout();
window.addEventListener(RESIZE_EVENT, layout);
document.addEventListener(LOAD_EVENT, layout, true);
