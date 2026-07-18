// Code runner exports
export {
    CodeBlock,
    insertCode,
    executeCode as runWithJudge0,
    setCodeRunnerConfig,
    getCodeRunnerConfig,
    isRunnerAvailable,
    JUDGE0_LANGUAGE_IDS,
} from "blocknote-layout-coderunner";

export type { CodeBlockProps, RunnerResult as Judge0Result, RunnerResult, CodeRunnerConfig } from "blocknote-layout-coderunner";

// Slideshow exports

export {
    PresentationModal,
    PresentToolbar,
    usePresentation,
    PRESENTATION_THEMES,
    generateSlidesFromBlocks,
} from "blocknote-layout-slideshow";

export type {
    PresentToolbarProps,
    UsePresentationOptions,
    UsePresentationReturn,
    PresentationTheme,
    SlideContent,
    HtmlSlide,
    WhiteboardSlide,
} from "blocknote-layout-slideshow";

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
} from "blocknote-layout-whiteboard";

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
} from "blocknote-layout-genius";

export type {
    GeniusNodeViewProps,
    GeniusNodeViewBaseProps,
    GeniusNodeViewConfig,
    GeniusSubmitResult,
    ToolOutputRendererProps,
    BotInfo,
} from "blocknote-layout-genius";

// Mentions exports
export {
    mentionInlineContentSpec,
    withMentions,
    getMentionSuggestionMenuItems,
    createMentionSuggestionMenuItems,
    insertGroupMention,
} from "blocknote-layout-mentions";

// Common utilities exports
export {
    asBlockNoteEditorForView,
} from "blocknote-layout-core";

export type {
    MentionProps,
    MentionInlineContentSchema,
    User,
    Group,
    OnUserSearch,
    GetMentionSuggestionMenuItemsOptions,
} from "blocknote-layout-mentions";
