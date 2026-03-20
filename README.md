<p align="center">
  <picture>
    <source media="(prefers-color-scheme: dark)" srcset="https://img.shields.io/badge/BlockNote_Layout-Extensions_for_BlockNote_Editor-blue?style=for-the-badge&logo=data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0id2hpdGUiPjxyZWN0IHg9IjIiIHk9IjIiIHdpZHRoPSI5IiBoZWlnaHQ9IjkiIHJ4PSIxIi8+PHJlY3QgeD0iMTMiIHk9IjIiIHdpZHRoPSI5IiBoZWlnaHQ9IjkiIHJ4PSIxIi8+PHJlY3QgeD0iMiIgeT0iMTMiIHdpZHRoPSIyMCIgaGVpZ2h0PSI5IiByeD0iMSIvPjwvc3ZnPg==&labelColor=1a1a2e&color=4361ee" />
    <img alt="BlockNote Layout" src="https://img.shields.io/badge/BlockNote_Layout-Extensions_for_BlockNote_Editor-blue?style=for-the-badge&logo=data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0id2hpdGUiPjxyZWN0IHg9IjIiIHk9IjIiIHdpZHRoPSI5IiBoZWlnaHQ9IjkiIHJ4PSIxIi8+PHJlY3QgeD0iMTMiIHk9IjIiIHdpZHRoPSI5IiBoZWlnaHQ9IjkiIHJ4PSIxIi8+PHJlY3QgeD0iMiIgeT0iMTMiIHdpZHRoPSIyMCIgaGVpZ2h0PSI5IiByeD0iMSIvPjwvc3ZnPg==&labelColor=1a1a2e&color=4361ee" />
  </picture>
</p>

<p align="center">
  <strong>Layout and utility extensions for <a href="https://www.blocknotejs.org/">BlockNote</a> — the open-source block-based rich text editor.</strong>
</p>

<p align="center">
  <a href="https://www.npmjs.com/package/blocknote-layout"><img src="https://img.shields.io/npm/v/blocknote-layout" alt="npm version" /></a>
  <a href="https://github.com/gyash1512/blocknote-layout/actions/workflows/ci.yml"><img src="https://github.com/gyash1512/blocknote-layout/actions/workflows/ci.yml/badge.svg" alt="CI" /></a>
  <a href="https://www.npmjs.com/package/blocknote-layout"><img src="https://img.shields.io/npm/l/blocknote-layout" alt="license" /></a>
</p>

---

## Features

| Module | Description |
|--------|-------------|
| **Multi-Column Layout** | Notion-style columns with resizable dividers, drag-and-drop, and responsive stacking |
| **Code Runner** | Execute code in-browser with multi-language support (Python via Pyodide, others via Judge0) and syntax highlighting |
| **Slideshow** | Create and present slides with Reveal.js integration and theme support |
| **Spreadsheet** | Embedded spreadsheets powered by Handsontable with formula support (HyperFormula) and charting (ECharts) |
| **Whiteboard** | Freeform drawing and diagramming canvas powered by Excalidraw |
| **Mentions** | @mention support for users and groups with autocomplete suggestions |

---

## Installation

```bash
npm install blocknote-layout
```

---

## Modules

### Multi-Column Layout

Create Notion-style multi-column layouts with drag-and-drop and resizable columns.

```ts
import { withMultiColumn, getMultiColumnSlashMenuItems } from "blocknote-layout";
// or: import { withMultiColumn } from "blocknote-layout/multicolumn";
```

**Key exports:** `withMultiColumn`, `createMultiColumnSchema`, `ColumnBlock`, `ColumnListBlock`, `getMultiColumnSlashMenuItems`, `createColumnResizeExtension`, `multiColumnDropCursor`

---

### Code Runner

Execute code directly in the browser. Supports Python (via Pyodide/WebAssembly), JavaScript, Java, Go, C++, Rust, PHP, and more (via Judge0).

```ts
import { CodeBlock, insertCode, setCodeRunnerConfig } from "blocknote-layout";
// or: import { CodeBlock } from "blocknote-layout/coderunner";
```

**Key exports:** `CodeBlock`, `insertCode`, `insertPythonCode`, `insertJavaScriptCode`, `executeCode`, `setCodeRunnerConfig`, `getCodeRunnerConfig`, `LANGUAGES`, `getSupportedLanguages`

**Highlights:**
- Syntax highlighting via CodeMirror
- Auto-detects and installs Python packages (pandas, numpy, scipy, matplotlib)
- Matplotlib plots rendered as images in the output
- Configurable execution backend

---

### Slideshow

Convert document content into presentation slides with Reveal.js.

```ts
import { usePresentation, PresentToolbar, PRESENTATION_THEMES } from "blocknote-layout";
// or: import { usePresentation } from "blocknote-layout/slideshow";
```

**Key exports:** `usePresentation`, `PresentationModal`, `PresentToolbar`, `generateSlidesFromBlocks`, `PRESENTATION_THEMES`

**Highlights:**
- Themes: white, black, beige, sky
- Fullscreen presentation modal
- Automatic block-to-slide conversion

---

### Spreadsheet

Embedded spreadsheets with formula support and charting.

```ts
import { withSpreadsheet, getSpreadsheetSlashMenuItems } from "blocknote-layout";
// or: import { withSpreadsheet } from "blocknote-layout/spreadsheet";
```

**Key exports:** `withSpreadsheet`, `createSpreadsheetSchema`, `SpreadsheetBlock`, `getSpreadsheetSlashMenuItems`, `insertSpreadsheet`, `SpreadsheetNodeView`

**Highlights:**
- Full spreadsheet editing via Handsontable
- Formula engine powered by HyperFormula
- Charting with ECharts

---

### Whiteboard

Freeform drawing and diagramming canvas.

```ts
import { withWhiteboard, getWhiteboardSlashMenuItems } from "blocknote-layout";
// or: import { withWhiteboard } from "blocknote-layout/whiteboard";
```

**Key exports:** `withWhiteboard`, `createWhiteboardSchema`, `WhiteboardBlock`, `getWhiteboardSlashMenuItems`, `insertWhiteboard`, `WhiteboardNodeView`

**Highlights:**
- Powered by Excalidraw
- Sketching, shapes, arrows, text, and more
- Embeds directly in the document

---

### Mentions

@mention support for users and groups with autocomplete.

```ts
import { withMentions, getMentionSuggestionMenuItems } from "blocknote-layout";
```

**Key exports:** `withMentions`, `getMentionSuggestionMenuItems`, `createMentionSuggestionMenuItems`, `insertGroupMention`, `mentionInlineContentSpec`

---

## Subpath Imports

Each module can be imported individually for tree-shaking:

```ts
import { withMultiColumn } from "blocknote-layout/multicolumn";
import { CodeBlock } from "blocknote-layout/coderunner";
import { usePresentation } from "blocknote-layout/slideshow";
import { withSpreadsheet } from "blocknote-layout/spreadsheet";
import { withWhiteboard } from "blocknote-layout/whiteboard";
```

---

## Peer Dependencies

| Package | Version |
|---------|---------|
| `@blocknote/core` | `0.47.1` |
| `@blocknote/mantine` | `0.47.1` |
| `@blocknote/react` | `0.47.1` |
| `@tiptap/core` | `^3.0.0` |
| `@uiw/react-codemirror` | `^4.21.0` |
| `react` | `^18.0.0 \|\| ^19.0.0` |
| `react-dom` | `^18.0.0 \|\| ^19.0.0` |
| `react-icons` | `^4.0.0 \|\| ^5.0.0` |

---

## License

See the [LICENSE](./LICENSE) file for details.
