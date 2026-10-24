const VIEW_TYPE = 'mdPreviewGutter.editor';
const MODE_PREVIEW = 'preview';
const MODE_SOURCE = 'source';
const MESSAGE_READY = 'ready';
const MESSAGE_INIT = 'init';
const MESSAGE_UPDATE = 'update';
const MESSAGE_EDIT = 'edit';
const MESSAGE_SET_MODE = 'setMode';
const MESSAGE_OPEN_LINK = 'openLink';
const MESSAGE_REVEAL_LINE = 'revealLine';
const COMMAND_OPEN = 'mdPreviewGutter.open';
const COMMAND_SHOW_PREVIEW = 'mdPreviewGutter.showPreview';
const COMMAND_SHOW_SOURCE = 'mdPreviewGutter.showSource';
const CONTEXT_MODE = 'mdPreviewGutter.mode';
const SET_CONTEXT_COMMAND = 'setContext';
const OPEN_WITH_COMMAND = 'vscode.openWith';
const ENABLE_SCRIPTS = true;
const RETAIN_CONTEXT_WHEN_HIDDEN = true;
const SUPPORTS_MULTIPLE_EDITORS = false;
const LINE_ATTR = 'data-line';
const CODE_LINE_CLASS = 'code-line';
const TOKEN_OPEN_NESTING = 1;
const HTML_TRUE = true;
const LINKIFY_TRUE = true;
const TYPOGRAPHER_FALSE = false;

module.exports = {
  VIEW_TYPE,
  MODE_PREVIEW,
  MODE_SOURCE,
  MESSAGE_READY,
  MESSAGE_INIT,
  MESSAGE_UPDATE,
  MESSAGE_EDIT,
  MESSAGE_SET_MODE,
  MESSAGE_OPEN_LINK,
  MESSAGE_REVEAL_LINE,
  COMMAND_OPEN,
  COMMAND_SHOW_PREVIEW,
  COMMAND_SHOW_SOURCE,
  CONTEXT_MODE,
  SET_CONTEXT_COMMAND,
  OPEN_WITH_COMMAND,
  ENABLE_SCRIPTS,
  RETAIN_CONTEXT_WHEN_HIDDEN,
  SUPPORTS_MULTIPLE_EDITORS,
  LINE_ATTR,
  CODE_LINE_CLASS,
  TOKEN_OPEN_NESTING,
  HTML_TRUE,
  LINKIFY_TRUE,
  TYPOGRAPHER_FALSE,
};
