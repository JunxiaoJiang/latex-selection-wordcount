# LaTeX Selection Word Count

See the word count for selected LaTeX text and daily manuscript growth in the VS Code status bar. The extension calls your local TeXCount installation, so LaTeX commands and citations follow TeXCount's counting rules.

## Install

1. Install TeXCount and check that `texcount -version` works in a terminal. MacTeX users can also use the bundled executable at `/Library/TeX/texbin/texcount`.
2. Download the `.vsix` file from the [latest release](https://github.com/JunxiaoJiang/latex-selection-wordcount/releases/latest).
3. In VS Code, open **Extensions → … → Install from VSIX…** and select the downloaded file. Reload the window if prompted.

Open a `.tex` file and select a sentence or paragraph. The status bar shows `N words selected`; clearing the selection hides the count. Multiple selections are counted together. No text is sent to an online service.

The second status-bar item shows the manuscript total and today's **net change**, for example `1,150 words · Today +150`. The project count includes chapters brought in by `\input` or `\include`, but excludes entries inside the standard `thebibliography` environment. It updates when you open a file and after saving a `.tex` file in the same project. Click the item, or run **LaTeX Word Count: Show Daily History**, to see recent daily totals and changes. The extension retains the last 90 recorded days on this machine; it stores counts and timestamps, never manuscript text.

The first count establishes a baseline, so changes made before the extension started tracking cannot be reconstructed. If you start at 1,000 words and later save at 1,150, the display shows `Today +150`. Deletions can make the change negative. On subsequent days the baseline is the most recent recorded total from an earlier day. Counts use your computer's local date and only reflect saved content.

By default, the daily count uses `main.tex` in the workspace folder if it exists; otherwise it uses the open `.tex` file. For another main file, set `latexSelectionWordCount.rootFile` to its path (relative to the workspace folder or absolute). Daily history is kept separately for each main file on this computer.

If TeXCount is installed elsewhere, set `latexSelectionWordCount.texcountPath` to its executable path in VS Code settings. By default, the extension tries `texcount` on `PATH`, then the MacTeX path on macOS.

The count comes from `texcount -1 -sum -` applied to the selection. Journal-specific word-count rules may differ.

## Build from source

With Node.js installed, run:

```bash
npm exec --yes --package=@vscode/vsce@4.0.0 -- vsce package --no-dependencies
```

Install the resulting `.vsix` through the VS Code Extensions menu or `code --install-extension latex-selection-wordcount-0.2.0.vsix`.

## 中文说明

在 VS Code 中选中 `.tex` 文件的一句或一段文字，状态栏会自动显示 TeXCount 统计的英文词数；取消选中后数字消失。多处选区会合并统计。扩展仅调用本机的 TeXCount，不会上传选中的内容。

状态栏还会显示整篇文稿的总词数和“今日净增”，例如 `1,150 words · Today +150`。项目统计会包含 `\input`、`\include` 引入的章节，但不计算标准 `thebibliography` 环境中的参考文献。保存后更新；点击状态栏数字可以查看近 90 个有记录日期的历史。首次启用时建立基线，无法倒推出之前每天的写作量；删减内容时净增可以为负数。记录只保存在本机，包含词数和时间，不包含论文正文。

默认统计工作区根目录的 `main.tex`；若不存在则统计当前文件。主文件位于其他位置时，可设置 `latexSelectionWordCount.rootFile`。每日统计按电脑本地日期划分，仅统计已保存的内容。

先安装 TeXCount，再到[最新版本页面](https://github.com/JunxiaoJiang/latex-selection-wordcount/releases/latest)下载 `.vsix` 文件，在 VS Code 的“扩展 → … → 从 VSIX 安装”中选择该文件。macOS 安装 MacTeX 后可直接使用；其他安装位置可设置 `latexSelectionWordCount.texcountPath`。

The project is released under the [MIT License](LICENSE). Issues and contributions are welcome.
