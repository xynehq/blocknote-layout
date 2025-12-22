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
    Slide,
    Slideshow,
    SlideBlock,
    SlideshowBlock,
    slideshowBlockSpecs,
    createSlideshowSchema,
    checkSlideshowBlocksInSchema,
    withSlideshow,
    slideshowSchema,
    getSlideshowSlashMenuItems,
    insertSlideshow,
    SlideshowNode,
    SlideNodeView,
    PresentationModal,
} from "./slideshow/main.js";

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

