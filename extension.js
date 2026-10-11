'use strict';

const { spawn } = require('node:child_process');
const vscode = require('vscode');

function runTeXCount(text, executable) {
  return new Promise((resolve, reject) => {
    const child = spawn(executable, ['-1', '-sum', '-'], {
      stdio: ['pipe', 'pipe', 'pipe']
    });
    let output = '';
    let errorOutput = '';

    child.stdout.on('data', chunk => { output += chunk.toString(); });
    child.stderr.on('data', chunk => { errorOutput += chunk.toString(); });
    child.stdin.on('error', () => {});
    child.on('error', reject);
    child.on('close', code => {
      if (code !== 0) {
        reject(new Error(errorOutput.trim() || `TeXCount exited with code ${code}.`));
        return;
      }
      const value = output.trim();
      if (!/^\d+$/.test(value)) {
        reject(new Error(`Unexpected TeXCount output: ${value}`));
        return;
      }
      resolve(Number(value));
    });
    child.stdin.end(text, 'utf8');
  });
}

async function countWords(text, executable) {
  try {
    return await runTeXCount(text, executable);
  } catch (error) {
    if (executable === 'texcount' && error.code === 'ENOENT' && process.platform === 'darwin') {
      return runTeXCount(text, '/Library/TeX/texbin/texcount');
    }
    throw error;
  }
}

function activate(context) {
  const status = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Right, 100);
  let timer;
  let revision = 0;

  function refresh() {
    const currentRevision = ++revision;
    clearTimeout(timer);
    const editor = vscode.window.activeTextEditor;
    if (!editor || (editor.document.languageId !== 'latex' && !editor.document.uri.fsPath.toLowerCase().endsWith('.tex'))) {
      status.hide();
      return;
    }

    const text = editor.selections
      .filter(selection => !selection.isEmpty)
      .map(selection => editor.document.getText(selection))
      .join('\n');
    if (!text.trim()) {
      status.hide();
      return;
    }

    status.text = 'Counting words…';
    status.tooltip = 'Counting selected LaTeX text with TeXCount';
    status.show();
    timer = setTimeout(() => {
      const executable = vscode.workspace
        .getConfiguration('latexSelectionWordCount', editor.document.uri)
        .get('texcountPath', 'texcount');
      countWords(text, executable).then(count => {
        if (currentRevision !== revision) return;
        status.text = `${count} words selected`;
        status.tooltip = 'Selected LaTeX text counted with TeXCount';
      }).catch(error => {
        if (currentRevision !== revision) return;
        status.text = 'Word count unavailable';
        status.tooltip = `TeXCount: ${error.message}`;
      });
    }, 180);
  }

  context.subscriptions.push(status);
  context.subscriptions.push(vscode.window.onDidChangeTextEditorSelection(refresh));
  context.subscriptions.push(vscode.window.onDidChangeActiveTextEditor(refresh));
  context.subscriptions.push(vscode.workspace.onDidChangeTextDocument(event => {
    if (event.document === vscode.window.activeTextEditor?.document) refresh();
  }));
  context.subscriptions.push(vscode.workspace.onDidChangeConfiguration(event => {
    if (event.affectsConfiguration('latexSelectionWordCount.texcountPath')) refresh();
  }));
  context.subscriptions.push({ dispose: () => { clearTimeout(timer); revision++; } });
  refresh();
}

module.exports = { activate };
