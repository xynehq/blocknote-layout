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

// Mentions exports
export {
    mentionInlineContentSpec,
    withMentions,
    getMentionSuggestionMenuItems,
    createMentionSuggestionMenuItems,
    insertGroupMention,
} from "blocknote-layout-mentions";

export type {
    MentionProps,
    MentionInlineContentSchema,
    User,
    Group,
    OnUserSearch,
    GetMentionSuggestionMenuItemsOptions,
} from "blocknote-layout-mentions";

// Common utilities exports
export {
    asBlockNoteEditorForView,
} from "blocknote-layout-core";
