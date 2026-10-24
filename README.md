# Markdown Preview Gutter

Adds **1-based source line numbers** beside the **built-in** Markdown preview (Cursor / VS Code), so you can cite lines while reading the rendered document.

## Recommended mode (0.2+, especially Cursor)

Leave the normal Markdown editor and **Preview** toggle as-is. Line numbers are injected via `markdown.previewScripts` / `markdown.previewStyles`.

```json
"mdPreviewGutter.useCustomEditor": false
```

Open preview with the tab **Preview** control, **Ctrl+Shift+V**, or **Open Preview to the Side**.

## Optional custom editor

Set `"mdPreviewGutter.useCustomEditor": true` to use the separate Gutter custom editor (better on plain VS Code; often problematic on Cursor).

## Install

**Extensions → Install from VSIX…** or:

`cursor --install-extension md-preview-gutter-0.2.0.vsix`

Then **Developer: Reload Window**.
