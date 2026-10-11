# LaTeX Selection Word Count

See the word count for selected LaTeX text directly in the VS Code status bar. The extension calls your local TeXCount installation, so LaTeX commands and citations follow TeXCount's counting rules.

## Install

1. Install TeXCount and check that `texcount -version` works in a terminal. MacTeX users can also use the bundled executable at `/Library/TeX/texbin/texcount`.
2. Download `latex-selection-wordcount-0.1.0.vsix` from the [latest release](https://github.com/JunxiaoJiang/latex-selection-wordcount/releases/latest).
3. In VS Code, open **Extensions → … → Install from VSIX…** and select the downloaded file. Reload the window if prompted.

Open a `.tex` file and select a sentence or paragraph. The status bar shows `N words selected`; clearing the selection hides the count. Multiple selections are counted together. No text is sent to an online service.

If TeXCount is installed elsewhere, set `latexSelectionWordCount.texcountPath` to its executable path in VS Code settings. By default, the extension tries `texcount` on `PATH`, then the MacTeX path on macOS.

The count comes from `texcount -1 -sum -` applied to the selection. Journal-specific word-count rules may differ.

## Build from source

With Node.js installed, run:

```bash
npm exec --yes --package=@vscode/vsce@4.0.0 -- vsce package --no-dependencies
```

Install the resulting `.vsix` through the VS Code Extensions menu or `code --install-extension latex-selection-wordcount-0.1.0.vsix`.

## 中文说明

在 VS Code 中选中 `.tex` 文件的一句或一段文字，状态栏会自动显示 TeXCount 统计的英文词数；取消选中后数字消失。多处选区会合并统计。扩展仅调用本机的 TeXCount，不会上传选中的内容。

先安装 TeXCount，再到[最新版本页面](https://github.com/JunxiaoJiang/latex-selection-wordcount/releases/latest)下载 `.vsix` 文件，在 VS Code 的“扩展 → … → 从 VSIX 安装”中选择该文件。macOS 安装 MacTeX 后可直接使用；其他安装位置可设置 `latexSelectionWordCount.texcountPath`。

The project is released under the [MIT License](LICENSE). Issues and contributions are welcome.
