// Multi-column layout exports
export {
    ColumnExtensions,
    MultiColumnBlock,
    ColumnBlock,
    ColumnListBlock,
    Column,
    ColumnList,
    multiColumnSchema,
    withMultiColumn,
    createMultiColumnSchema,
    multiColumnBlockSpecs,
    getMultiColumnSlashMenuItems,
    createColumnResizeExtension,
    multiColumnDropCursor,
} from "./multicolumn/main.js";

// Code runner exports
export {
    CodeBlock,
    insertCode,
    executeCode as runWithJudge0,
    setCodeRunnerConfig,
    getCodeRunnerConfig,
    isRunnerAvailable,
    JUDGE0_LANGUAGE_IDS,
} from "./coderunner/main.js";

export type { CodeBlockProps, RunnerResult as Judge0Result, RunnerResult, CodeRunnerConfig } from "./coderunner/main.js";

// Slideshow exports

export {
    PresentationModal,
    PresentToolbar,
    usePresentation,
    PRESENTATION_THEMES,
    generateSlidesFromBlocks,
} from "./slideshow/main.js";

export type {
    PresentToolbarProps,
    UsePresentationOptions,
    UsePresentationReturn,
    PresentationTheme,
    SlideContent,
    HtmlSlide,
    WhiteboardSlide,
} from "./slideshow/main.js";

// Spreadsheet exports
export {
    spreadsheetBlockSpecs,
    getSpreadsheetSlashMenuItems,
} from "./spreadsheet/main.js";

// Whiteboard exports
export {
    Whiteboard,
    WhiteboardBlock,
    whiteboardBlockSpecs,
    createWhiteboardSchema,
    checkWhiteboardBlocksInSchema,
    withWhiteboard,
    whiteboardSchema,
    getWhiteboardSlashMenuItems,
    insertWhiteboard,
    WhiteboardNodeView,
} from "./whiteboard/main.js";

// Genius exports
export {
    Genius,
    GeniusBlock,
    geniusBlockSpecs,
    createGeniusSchema,
    withGenius,
    geniusSchema,
    getGeniusSlashMenuItems,
    insertGenius,
    configureGeniusNodeView,
    GeniusNodeViewBase,
    configureGeniusNodeViewConfig,
    getGeniusNodeViewConfig,
} from "./genius/main.js";

export type {
    GeniusNodeViewProps,
    GeniusNodeViewBaseProps,
    GeniusNodeViewConfig,
    GeniusSubmitResult,
    ToolOutputRendererProps,
} from "./genius/main.js";

