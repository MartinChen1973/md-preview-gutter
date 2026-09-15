const { MODE_PREVIEW } = require('./constants');

function getNonce() {
  const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  const bytes = require('crypto').randomBytes(16);
  let text = '';
  for (const byte of bytes) {
    text += alphabet.charAt(byte % alphabet.length);
  }
  return text;
}

function buildWebviewHtml(webview, extensionUri) {
  const nonce = getNonce();
  const cssUri = webview.asWebviewUri(
    require('vscode').Uri.joinPath(extensionUri, 'media', 'editor.css')
  );
  const jsUri = webview.asWebviewUri(
    require('vscode').Uri.joinPath(extensionUri, 'media', 'editor.js')
  );
  const csp = [
    `default-src 'none'`,
    `style-src ${webview.cspSource} 'unsafe-inline'`,
    `script-src 'nonce-${nonce}'`,
    `img-src ${webview.cspSource} https: data:`,
    `font-src ${webview.cspSource} data:`,
  ].join('; ');

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta http-equiv="Content-Security-Policy" content="${csp}" />
  <link rel="stylesheet" href="${cssUri}" />
</head>
<body data-mode="${MODE_PREVIEW}">
  <div id="toggle-group">
    <button type="button" class="toggle-tab" data-mode="preview">Preview</button>
    <button type="button" class="toggle-tab" data-mode="source">Markdown</button>
  </div>
  <div id="preview-wrap">
    <div id="md-preview-gutter"></div>
    <div id="preview" class="markdown-body"></div>
  </div>
  <div id="source-wrap">
    <pre id="source-gutter"></pre>
    <textarea id="source" spellcheck="false"></textarea>
  </div>
  <script nonce="${nonce}" src="${jsUri}"></script>
</body>
</html>`;
}

module.exports = { buildWebviewHtml };
