const vscode = acquireVsCodeApi();
const GUTTER_ROOT_ID = 'md-preview-gutter';
const MARK_CLASS = 'md-preview-gutter-mark';
const LINE_SELECTOR = '.code-line[data-line]';
const LINE_ATTR = 'data-line';
const LINE_NUMBER_OFFSET = 1;
const MODE_PREVIEW = 'preview';
const MESSAGE_READY = 'ready';
const MESSAGE_INIT = 'init';
const MESSAGE_UPDATE = 'update';
const MESSAGE_EDIT = 'edit';
const MESSAGE_SET_MODE = 'setMode';
const MESSAGE_OPEN_LINK = 'openLink';
const MESSAGE_REVEAL_LINE = 'revealLine';
const TARGET_CLASS = 'md-preview-gutter-target';
const CENTER_DIVISOR = 2;
const BODY_MODE_ATTR = 'data-mode';
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
  requestAnimationFrame(() => {
    layoutPreviewGutter();
    revealAfterLayout(message.line);
  });
}

function revealAfterLayout(line) {
  if (!line) {
    return;
  }
  revealCitedLine(line);
}

function onHostMessage(event) {
  const message = event.data;
  const handlers = {
    [MESSAGE_INIT]: () => applySnapshot(message),
    [MESSAGE_UPDATE]: () => applySnapshot(message),
    [MESSAGE_SET_MODE]: () => setMode(message.mode),
    [MESSAGE_REVEAL_LINE]: () => revealCitedLine(message.line),
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

function revealCitedLine(lineNumber) {
  revealPreviewLine(lineNumber);
  revealSourceLine(lineNumber);
}

function revealPreviewLine(lineNumber) {
  const index = lineNumber - LINE_NUMBER_OFFSET;
  const chosen = elementAtOrBefore(previewEl.querySelectorAll(LINE_SELECTOR), index);
  if (!chosen) {
    return;
  }
  markTarget(chosen);
  const top = chosen.getBoundingClientRect().top
    - previewWrap.getBoundingClientRect().top
    + previewWrap.scrollTop;
  previewWrap.scrollTop = top - previewWrap.clientHeight / CENTER_DIVISOR;
}

function elementAtOrBefore(elements, index) {
  let chosen = null;
  for (const element of elements) {
    const line = Number(element.getAttribute(LINE_ATTR));
    if (line <= index) {
      chosen = element;
    }
  }
  return chosen;
}

function markTarget(element) {
  const previous = previewEl.querySelector(`.${TARGET_CLASS}`);
  if (previous) {
    previous.classList.remove(TARGET_CLASS);
  }
  element.classList.add(TARGET_CLASS);
}

function revealSourceLine(lineNumber) {
  const count = Math.max(sourceEl.value.split(NEWLINE).length, LINE_NUMBER_OFFSET);
  const height = sourceEl.scrollHeight / count;
  const index = Math.max(lineNumber - LINE_NUMBER_OFFSET, 0);
  sourceEl.scrollTop = index * height - sourceEl.clientHeight / CENTER_DIVISOR;
}

function onPreviewLinkClick(event) {
  const anchor = event.target.closest && event.target.closest('a');
  const href = anchor && (anchor.getAttribute('data-memo-href') || anchor.getAttribute('href'));
  if (!href) {
    return;
  }
  event.preventDefault();
  event.stopPropagation();
  event.stopImmediatePropagation();
  vscode.postMessage({ type: MESSAGE_OPEN_LINK, href });
}

document.addEventListener('click', onPreviewLinkClick, true);
sourceEl.addEventListener('input', onSourceInput);
sourceEl.addEventListener('scroll', () => {
  sourceGutterEl.scrollTop = sourceEl.scrollTop;
});
previewWrap.addEventListener('scroll', layoutPreviewGutter);
window.addEventListener('resize', layoutPreviewGutter);
window.addEventListener('message', onHostMessage);
setMode(MODE_PREVIEW);
vscode.postMessage({ type: MESSAGE_READY });
