# Markdown Preview Gutter

A Cursor / VS Code Markdown preview that shows **1-based source line numbers** in a left gutter, so review comments can cite a line while you look at the rendered document.

## Install from VSIX

1. Install the `.vsix` via **Extensions → … → Install from VSIX…**, or:

   `cursor --install-extension md-preview-gutter-0.1.4.vsix`

2. **Developer: Reload Window**
3. Close and reopen `.md` tabs.

## Default editor

This build associates `*.md` / `*.markdown` with the gutter preview. To use the normal text editor for one file: tab context menu → **Reopen Editor With…**.

To stop using it as the default:

```json
"workbench.editorAssociations": {
  "*.md": "default",
  "*.markdown": "default"
}
```

## Commands

- **Markdown Preview Gutter: Open Preview with Line Numbers**
