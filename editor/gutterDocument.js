const vscode = require('vscode');

class GutterDocument {
  constructor(resourceUri, textDocument) {
    this.uri = resourceUri;
    this.textDocument = textDocument;
  }

  dispose() {}
}

async function loadTextDocument(resourceUri) {
  if (resourceUri.scheme === 'file') {
    const bytes = await vscode.workspace.fs.readFile(resourceUri);
    const text = new TextDecoder().decode(bytes);
    return vscode.workspace.openTextDocument({ language: 'markdown', content: text });
  }
  return vscode.workspace.openTextDocument(resourceUri);
}

async function openGutterDocument(uri) {
  const textDocument = await loadTextDocument(uri);
  return new GutterDocument(uri, textDocument);
}

async function saveGutterDocument(document) {
  const sameUri = document.textDocument.uri.toString() === document.uri.toString();
  if (sameUri && document.uri.scheme === 'file') {
    await document.textDocument.save();
    return;
  }
  const bytes = new TextEncoder().encode(document.textDocument.getText());
  await vscode.workspace.fs.writeFile(document.uri, bytes);
}

async function saveGutterDocumentAs(document, destination) {
  const bytes = new TextEncoder().encode(document.textDocument.getText());
  await vscode.workspace.fs.writeFile(destination, bytes);
}

async function revertGutterDocument(document) {
  const bytes = await vscode.workspace.fs.readFile(document.uri);
  const text = new TextDecoder().decode(bytes);
  const edit = new vscode.WorkspaceEdit();
  const fullRange = new vscode.Range(
    document.textDocument.positionAt(0),
    document.textDocument.positionAt(document.textDocument.getText().length)
  );
  edit.replace(document.textDocument.uri, fullRange, text);
  await vscode.workspace.applyEdit(edit);
}

async function backupGutterDocument(document, context) {
  await saveGutterDocumentAs(document, context.destination);
  return {
    id: context.destination.toString(),
    delete: () => deleteBackup(context.destination),
  };
}

async function deleteBackup(uri) {
  try {
    await vscode.workspace.fs.delete(uri);
  } catch (_error) {
    return;
  }
}

module.exports = {
  GutterDocument,
  openGutterDocument,
  saveGutterDocument,
  saveGutterDocumentAs,
  revertGutterDocument,
  backupGutterDocument,
};
