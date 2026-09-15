const vscode = acquireVsCodeApi();
const GUTTER_ROOT_ID = 'md-preview-gutter';
const MARK_CLASS = 'md-preview-gutter-mark';
const LINE_SELECTOR = '.code-line[data-line]';
const LINE_ATTR = 'data-line';
const LINE_NUMBER_OFFSET = 1;
const MODE_PREVIEW = 'preview';
const MODE_SOURCE = 'source';
const MESSAGE_READY = 'ready';
const MESSAGE_INIT = 'init';
const MESSAGE_UPDATE = 'update';
const MESSAGE_EDIT = 'edit';
const BODY_MODE_ATTR = 'data-mode';
const ACTIVE_CLASS = 'active';
const NEWLINE = '\n';

const previewEl = document.getElementById('preview');
const sourceEl = document.getElementById('source');
const sourceGutterEl = document.getElementById('source-gutter');
const previewWrap = document.getElementById('preview-wrap');

let applyingFromHost = false;

function sourceLineOf(element) {
  return Number(element.getAttribute(LINE_ATTR)) + LINE_NUMBER_OFFSET;
}

function markTop(element) {
  return element.getBoundingClientRect().top + previewWrap.scrollTop - previewWrap.getBoundingClientRect().top;
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

function layoutPreviewGutter() {
  const root = document.getElementById(GUTTER_ROOT_ID);
  const chosen = firstElementPerLine(previewEl.querySelectorAll(LINE_SELECTOR));
  const fragment = document.createDocumentFragment();
  for (const [line, element] of chosen) {
    fragment.appendChild(createMark(line, element));
  }
  root.replaceChildren(fragment);
}

function layoutSourceGutter(text) {
  const count = text.split(NEWLINE).length;
  const lines = [];
  for (let index = 1; index <= count; index += 1) {
    lines.push(String(index));
  }
  sourceGutterEl.textContent = lines.join(NEWLINE);
}

function setMode(mode) {
  document.body.setAttribute(BODY_MODE_ATTR, mode);
  for (const button of document.querySelectorAll('.toggle-tab')) {
    button.classList.toggle(ACTIVE_CLASS, button.dataset.mode === mode);
  }
  if (mode === MODE_PREVIEW) {
    requestAnimationFrame(layoutPreviewGutter);
  }
}

function applySnapshot(message) {
  applyingFromHost = true;
  previewEl.innerHTML = message.html ?? '';
  sourceEl.value = message.text ?? '';
  layoutSourceGutter(sourceEl.value);
  if (message.mode) {
    setMode(message.mode);
  }
  applyingFromHost = false;
  requestAnimationFrame(layoutPreviewGutter);
}

function onHostMessage(event) {
  const message = event.data;
  const handlers = {
    [MESSAGE_INIT]: () => applySnapshot(message),
    [MESSAGE_UPDATE]: () => applySnapshot(message),
  };
  handlers[message.type]?.();
}

function onSourceInput() {
  if (applyingFromHost) {
    return;
  }
  layoutSourceGutter(sourceEl.value);
  vscode.postMessage({ type: MESSAGE_EDIT, text: sourceEl.value });
}

for (const button of document.querySelectorAll('.toggle-tab')) {
  button.addEventListener('click', () => setMode(button.dataset.mode));
}

sourceEl.addEventListener('input', onSourceInput);
sourceEl.addEventListener('scroll', () => {
  sourceGutterEl.scrollTop = sourceEl.scrollTop;
});
previewWrap.addEventListener('scroll', layoutPreviewGutter);
window.addEventListener('resize', layoutPreviewGutter);
window.addEventListener('message', onHostMessage);
setMode(MODE_PREVIEW);
vscode.postMessage({ type: MESSAGE_READY });
