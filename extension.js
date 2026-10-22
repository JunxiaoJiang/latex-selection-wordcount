'use strict';

const { spawn } = require('node:child_process');
const fs = require('node:fs');
const path = require('node:path');
const vscode = require('vscode');
const { localDate, recordCount } = require('./daily');

function runTeXCount(text, executable, filePath) {
  return new Promise((resolve, reject) => {
    const args = filePath
      ? ['-1', '-sum', '-merge', path.basename(filePath)]
      : ['-1', '-sum', '-'];
    const child = spawn(executable, args, {
      cwd: filePath ? path.dirname(filePath) : undefined,
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
    child.stdin.end(text || '', 'utf8');
  });
}

async function countWords(text, executable, filePath) {
  try {
    return await runTeXCount(text, executable, filePath);
  } catch (error) {
    if (executable === 'texcount' && error.code === 'ENOENT' && process.platform === 'darwin') {
      return runTeXCount(text, '/Library/TeX/texbin/texcount', filePath);
    }
    throw error;
  }
}

function isLatex(document) {
  return document && (document.languageId === 'latex' || document.uri.fsPath.toLowerCase().endsWith('.tex'));
}

function rootFile(document) {
  const folder = vscode.workspace.getWorkspaceFolder(document.uri);
  const configured = vscode.workspace
    .getConfiguration('latexSelectionWordCount', document.uri)
    .get('rootFile', '').trim();
  if (configured) {
    return path.resolve(folder ? folder.uri.fsPath : path.dirname(document.uri.fsPath), configured);
  }
  if (folder) {
    const main = path.join(folder.uri.fsPath, 'main.tex');
    if (fs.existsSync(main)) return main;
  }
  return document.uri.fsPath;
}

function activate(context) {
  const selectionStatus = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Right, 100);
  const dailyStatus = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Right, 99);
  let timer;
  let revision = 0;
  let dailyRevision = 0;

  function refreshSelection() {
    const currentRevision = ++revision;
    clearTimeout(timer);
    const editor = vscode.window.activeTextEditor;
    if (!editor || !isLatex(editor.document)) {
      selectionStatus.hide();
      return;
    }

    const text = editor.selections
      .filter(selection => !selection.isEmpty)
      .map(selection => editor.document.getText(selection))
      .join('\n');
    if (!text.trim()) {
      selectionStatus.hide();
      return;
    }

    selectionStatus.text = 'Counting words…';
    selectionStatus.tooltip = 'Counting selected LaTeX text with TeXCount';
    selectionStatus.show();
    timer = setTimeout(() => {
      const executable = vscode.workspace
        .getConfiguration('latexSelectionWordCount', editor.document.uri)
        .get('texcountPath', 'texcount');
      countWords(text, executable).then(count => {
        if (currentRevision !== revision) return;
        selectionStatus.text = `${count} words selected`;
        selectionStatus.tooltip = 'Selected LaTeX text counted with TeXCount';
      }).catch(error => {
        if (currentRevision !== revision) return;
        selectionStatus.text = 'Word count unavailable';
        selectionStatus.tooltip = `TeXCount: ${error.message}`;
      });
    }, 180);
  }

  async function refreshDaily(document) {
    const currentRevision = ++dailyRevision;
    if (!isLatex(document) || document.isUntitled) {
      dailyStatus.hide();
      return;
    }
    const root = rootFile(document);
    if (!fs.existsSync(root)) {
      dailyStatus.text = 'Daily count unavailable';
      dailyStatus.tooltip = `Main file not found: ${root}`;
      dailyStatus.show();
      return;
    }
    dailyStatus.text = 'Counting manuscript…';
    dailyStatus.show();
    try {
      const executable = vscode.workspace
        .getConfiguration('latexSelectionWordCount', document.uri)
        .get('texcountPath', 'texcount');
      const count = await countWords('', executable, root);
      if (currentRevision !== dailyRevision) return;
      const all = context.globalState.get('dailyCounts.v1', {});
      const now = new Date();
      const history = recordCount(all[root] || {}, count, now);
      await context.globalState.update('dailyCounts.v1', { ...all, [root]: history });
      if (currentRevision !== dailyRevision) return;
      const today = history[localDate(now)];
      const delta = today.count - today.baseline;
      dailyStatus.text = `$(book) ${count} words · Today ${delta >= 0 ? '+' : ''}${delta}`;
      dailyStatus.tooltip = today.partial
        ? `Counted from ${path.basename(root)} and its included chapters. Tracking began today; earlier edits cannot be recovered. Click for daily history.`
        : `Counted from ${path.basename(root)} and its included chapters. References in thebibliography are excluded. Click for daily history.`;
      dailyStatus.command = 'latexSelectionWordCount.showDailyHistory';
    } catch (error) {
      if (currentRevision !== dailyRevision) return;
      dailyStatus.text = 'Daily count unavailable';
      dailyStatus.tooltip = `TeXCount: ${error.message}`;
    }
  }

  context.subscriptions.push(selectionStatus, dailyStatus);
  context.subscriptions.push(vscode.commands.registerCommand('latexSelectionWordCount.showDailyHistory', () => {
    const document = vscode.window.activeTextEditor?.document;
    if (!isLatex(document)) return;
    const history = context.globalState.get('dailyCounts.v1', {})[rootFile(document)] || {};
    const items = Object.entries(history).sort(([a], [b]) => b.localeCompare(a)).map(([date, entry]) => {
      const delta = entry.count - entry.baseline;
      return {
        label: `${date}  ${delta >= 0 ? '+' : ''}${delta} words`,
        description: `${entry.count} total${entry.partial ? ' · tracking started this day' : ''}`
      };
    });
    vscode.window.showQuickPick(items.length ? items : [{ label: 'No daily counts yet' }], {
      title: 'Daily LaTeX word-count history'
    });
  }));
  context.subscriptions.push(vscode.window.onDidChangeTextEditorSelection(refreshSelection));
  context.subscriptions.push(vscode.window.onDidChangeActiveTextEditor(editor => {
    refreshSelection();
    if (editor) refreshDaily(editor.document);
    else { dailyRevision++; dailyStatus.hide(); }
  }));
  context.subscriptions.push(vscode.workspace.onDidChangeTextDocument(event => {
    if (event.document === vscode.window.activeTextEditor?.document) refreshSelection();
  }));
  context.subscriptions.push(vscode.workspace.onDidSaveTextDocument(document => {
    const active = vscode.window.activeTextEditor?.document;
    if (isLatex(document) && isLatex(active) && rootFile(document) === rootFile(active)) {
      refreshDaily(active);
    }
  }));
  context.subscriptions.push(vscode.workspace.onDidChangeConfiguration(event => {
    if (event.affectsConfiguration('latexSelectionWordCount')) {
      refreshSelection();
      if (vscode.window.activeTextEditor) refreshDaily(vscode.window.activeTextEditor.document);
    }
  }));
  context.subscriptions.push({ dispose: () => { clearTimeout(timer); revision++; dailyRevision++; } });
  refreshSelection();
  if (vscode.window.activeTextEditor) refreshDaily(vscode.window.activeTextEditor.document);
}

module.exports = { activate };
