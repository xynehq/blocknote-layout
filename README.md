# BlockNote Layout

Layout and utility extensions for [BlockNote](https://www.blocknotejs.org/) - the open-source block-based rich text editor.

[![npm version](https://img.shields.io/npm/v/blocknote-layout)](https://www.npmjs.com/package/blocknote-layout)
[![CI](https://github.com/gyash1512/blocknote-layout/actions/workflows/ci.yml/badge.svg)](https://github.com/gyash1512/blocknote-layout/actions/workflows/ci.yml)

---

## Features

- **Python Code Runner** - Execute Python code in-browser using Pyodide with package support

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

## Subpath Imports

You can also import from specific subpaths for tree-shaking:

```ts

// Import only code runner
import { CodeBlock } from "blocknote-layout/coderunner";
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

## License

This package contains components under different licenses:

- **Code Runner** (`lib/coderunner/`): [MIT](lib/coderunner/LICENSE) © [Harshpreet Singh](https://github.com/harshpreet-singh)

See the [LICENSE](./LICENSE) file for details.

