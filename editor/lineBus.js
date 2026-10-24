const { MESSAGE_REVEAL_LINE } = require('./constants');

const panels = new Map();
const pending = new Map();

function pathKey(fsPath) {
  return fsPath.replace(/\\/g, '/').toLowerCase();
}

function registerPanel(fsPath, panel) {
  panels.set(pathKey(fsPath), panel);
}

function unregisterPanel(fsPath, panel) {
  const key = pathKey(fsPath);
  if (panels.get(key) === panel) {
    panels.delete(key);
  }
}

function rememberLine(fsPath, line) {
  pending.set(pathKey(fsPath), line);
}

function takeLine(fsPath) {
  const key = pathKey(fsPath);
  const line = pending.get(key);
  pending.delete(key);
  return line;
}

function revealOpenPanel(fsPath, line) {
  const panel = panels.get(pathKey(fsPath));
  if (!panel) {
    return false;
  }
  panel.reveal();
  panel.webview.postMessage({ type: MESSAGE_REVEAL_LINE, line });
  return true;
}

module.exports = {
  registerPanel,
  unregisterPanel,
  rememberLine,
  takeLine,
  revealOpenPanel,
};
