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
    insertGroupMention,
} from "./extensions/getMentionSuggestionMenuItems.js";

export type {
    User,
    Group,
    OnUserSearch,
    GetMentionSuggestionMenuItemsOptions,
} from "./extensions/getMentionSuggestionMenuItems.js";
