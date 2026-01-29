// Mention inline content exports
export {
    mentionInlineContentSpec,
    withMentions,
} from "./blocks/schema.js";

export type {
    MentionProps,
    MentionInlineContentSchema,
} from "./blocks/schema.js";

export {
    getMentionSuggestionMenuItems,
    createMentionSuggestionMenuItems,
} from "./extensions/getMentionSuggestionMenuItems.js";

export type {
    User,
    OnUserSearch,
    GetMentionSuggestionMenuItemsOptions,
} from "./extensions/getMentionSuggestionMenuItems.js";
