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
| **Code Runner** | Execute code in-browser with multi-language support (via Judge0 or custom handlers) and syntax highlighting |
| **Slideshow** | Create and present slides with Reveal.js integration and theme support |
| **Whiteboard** | Freeform drawing and diagramming canvas powered by Excalidraw |
| **Genius** | AI assistant block with configurable node views |
| **Mentions** | @mention support for users and groups with autocomplete suggestions |

---

## Installation

Every block ships as its own package — install only what you need:

```bash
pnpm add blocknote-layout-slideshow
```

Or install the umbrella package, which re-exports every block:

```bash
pnpm add blocknote-layout
```

| Package | Contents |
|---------|----------|
| [`blocknote-layout`](./packages/blocknote-layout) | Umbrella — re-exports all blocks |
| [`blocknote-layout-coderunner`](./packages/coderunner) | Code runner block |
| [`blocknote-layout-slideshow`](./packages/slideshow) | Slideshow presentations |
| [`blocknote-layout-whiteboard`](./packages/whiteboard) | Whiteboard block |
| [`blocknote-layout-genius`](./packages/genius) | Genius AI block |
| [`blocknote-layout-mentions`](./packages/mentions) | Mention inline content (+ React-free server entry) |
| [`blocknote-layout-core`](./packages/core) | Shared utilities |

---

## Modules

### Code Runner

Execute code directly in the browser. Supports Python, JavaScript, Java, Go, C++, Rust, PHP, and more (via Judge0 or custom handlers).

```ts
import { CodeBlock, insertCode, setCodeRunnerConfig } from "blocknote-layout";
// or standalone: import { CodeBlock } from "blocknote-layout-coderunner";
```

**Key exports:** `CodeBlock`, `insertCode`, `insertPythonCode`, `insertJavaScriptCode`, `executeCode`, `setCodeRunnerConfig`, `getCodeRunnerConfig`, `LANGUAGES`, `getSupportedLanguages`

**Highlights:**
- Syntax highlighting via CodeMirror
- Configurable execution backend

---

### Slideshow

Convert document content into presentation slides with Reveal.js.

```ts
import { usePresentation, PresentToolbar, PRESENTATION_THEMES } from "blocknote-layout";
// or standalone: import { usePresentation } from "blocknote-layout-slideshow";
```

**Key exports:** `usePresentation`, `PresentationModal`, `PresentToolbar`, `generateSlidesFromBlocks`, `PRESENTATION_THEMES`

**Highlights:**
- Themes: white, black, beige, sky
- Fullscreen presentation modal
- Automatic block-to-slide conversion

---

### Whiteboard

Freeform drawing and diagramming canvas.

```ts
import { withWhiteboard, getWhiteboardSlashMenuItems } from "blocknote-layout";
// or standalone: import { withWhiteboard } from "blocknote-layout-whiteboard";
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

## Selective Installs

Every block is a standalone package — depend on it directly and skip the rest (and their dependencies):

```ts
import { CodeBlock } from "blocknote-layout-coderunner";
import { usePresentation } from "blocknote-layout-slideshow";
import { withWhiteboard } from "blocknote-layout-whiteboard";
```

If you use the umbrella package, its subpath imports (`blocknote-layout/coderunner`, `blocknote-layout/slideshow`, …) keep working.

---

## Peer Dependencies

| Package | Version |
|---------|---------|
| `@blocknote/core` | `0.51.4` |
| `@blocknote/mantine` | `0.51.4` |
| `@blocknote/react` | `0.51.4` |
| `@tiptap/core` | `^3.0.0` |
| `@uiw/react-codemirror` | `^4.21.0` |
| `react` | `^18.0.0 \|\| ^19.0.0` |
| `react-dom` | `^18.0.0 \|\| ^19.0.0` |
| `react-icons` | `^4.0.0 \|\| ^5.0.0` |

---

## License

See the [LICENSE](./LICENSE) file for details.
