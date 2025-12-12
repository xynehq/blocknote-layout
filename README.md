# BlockNote Layout

Layout and utility extensions for [BlockNote](https://www.blocknotejs.org/) - the open-source block-based rich text editor.

[![npm version](https://img.shields.io/npm/v/blocknote-layout)](https://www.npmjs.com/package/blocknote-layout)
[![CI](https://github.com/gyash1512/blocknote-layout/actions/workflows/ci.yml/badge.svg)](https://github.com/gyash1512/blocknote-layout/actions/workflows/ci.yml)

---

## Features

- **Python Code Runner** - Execute Python code in-browser using Pyodide with package support
- **Slideshow Presentations** - Create and present slides with Reveal.js integration

---

## Installation

```bash
npm install blocknote-layout
```

---

## Python Code Runner

Execute Python code directly in the browser using Pyodide.

```tsx
import { BlockNoteSchema, defaultBlockSpecs } from "@blocknote/core";
import { BlockNoteView } from "@blocknote/mantine";
import { useCreateBlockNote, SuggestionMenuController, getDefaultReactSlashMenuItems, filterSuggestionItems } from "@blocknote/react";
import { CodeBlock, insertCode } from "blocknote-layout";
// or: import { CodeBlock, insertCode } from "blocknote-layout/coderunner";

const schema = BlockNoteSchema.create({
  blockSpecs: {
    ...defaultBlockSpecs,
    codeRunner: CodeBlock,
  },
});

function App() {
  const editor = useCreateBlockNote({ schema });

  return (
    <BlockNoteView editor={editor} slashMenu={false}>
      <SuggestionMenuController
        triggerCharacter="/"
        getItems={async (query) =>
          filterSuggestionItems(
            [...getDefaultReactSlashMenuItems(editor), insertCode()],
            query
          )
        }
      />
    </BlockNoteView>
  );
}
```

### Code Runner Features

- **In-Browser Runtime**: Full CPython 3.12 environment via WebAssembly
- **Package Support**: Auto-detects and installs imports (pandas, numpy, scipy, matplotlib)
- **Output Capture**: Terminal-style output for stdout and stderr
- **Matplotlib Support**: Renders plots as images in the output

### Code Runner Exports

```ts
import {
  CodeBlock,
  insertCode,
  runPython,
  getPyodide,
  isPyodideLoaded,
  isPyodideLoading,
} from "blocknote-layout";

import type { CodeBlockProps, PythonResult } from "blocknote-layout";
```

---

## Slideshow Presentations

Create presentation slides with Reveal.js integration directly in BlockNote.

```tsx
import { BlockNoteSchema, defaultBlockSpecs } from "@blocknote/core";
import { BlockNoteView } from "@blocknote/mantine";
import { useCreateBlockNote } from "@blocknote/react";
import { withSlideshow, getSlideshowSlashMenuItems } from "blocknote-layout";
// or: import { withSlideshow } from "blocknote-layout/slideshow";

// Create schema with slideshow support
const schema = withSlideshow(BlockNoteSchema.create());

function App() {
  const editor = useCreateBlockNote({ schema });

  return <BlockNoteView editor={editor} />;
}
```

### Slideshow Features

- **Reveal.js Integration**: Full-featured presentation mode with transitions
- **Slide Management**: Create, organize, and present slides within your editor
- **Auto-conversion**: Convert regular blocks into presentation slides
- **Presentation Modal**: Immersive fullscreen presentation experience

### Slideshow Exports

```ts
import {
  // Schema utilities
  withSlideshow,
  createSlideshowSchema,
  slideshowSchema,
  slideshowBlockSpecs,
  checkSlideshowBlocksInSchema,
  
  // Block components
  SlideBlock,
  SlideshowBlock,
  
  // ProseMirror nodes
  Slide,
  Slideshow,
  
  // Extensions and utilities
  getSlideshowSlashMenuItems,
  insertSlideshow,
  
  // React components
  SlideshowNode,
  SlideNodeView,
  PresentationModal,
} from "blocknote-layout";
```

---

## Subpath Imports

You can also import from specific subpaths for tree-shaking:

```ts

// Import only code runner
import { CodeBlock } from "blocknote-layout/coderunner";

// Import only slideshow
import { withSlideshow } from "blocknote-layout/slideshow";
```

---

## Peer Dependencies

```json
{
  "@blocknote/core": "^0.42.3",
  "@blocknote/mantine": "^0.42.3",
  "@blocknote/react": "^0.42.3",
  "@tiptap/core": "^3.0.0",
  "@uiw/react-codemirror": "^4.21.0",
  "react": "^18.0.0 || ^19.0.0",
  "react-dom": "^18.0.0 || ^19.0.0",
  "react-icons": "^4.0.0 || ^5.0.0"
}
```

---

See the [LICENSE](./LICENSE) file for details.

