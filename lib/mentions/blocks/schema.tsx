import { createReactInlineContentSpec } from "@blocknote/react";
import { InlineContentSchema, StyleSchema } from "@blocknote/core";

/**
 * Props for mention inline content (user or group)
 */
export interface MentionProps {
    userId: string;
    username: string;
    userEmail: string;
    userPicture: string;
    /** When set, this mention is a group mention; backend expands to member user IDs */
    groupId?: string;
    groupName?: string;
}

/**
 * Mention inline content spec
 * Renders as @username or @groupName (for group mentions)
 */
export const mentionInlineContentSpec = createReactInlineContentSpec(
    {
        type: "mention",
        propSchema: {
            userId: {
                default: "",
            },
            username: {
                default: "",
            },
            userEmail: {
                default: "",
            },
            userPicture: {
                default: "",
            },
            groupId: {
                default: "",
            },
            groupName: {
                default: "",
            },
        },
        content: "none",
    },
    {
        render: (props) => {
            const p = props.inlineContent.props as MentionProps;
            const displayName = (p.groupId && p.groupName) ? p.groupName : (p.username || "");
            return (
                <span
                    style={{
                        backgroundColor: "rgba(0, 0, 0, 0.05)",
                        borderRadius: "4px",
                        padding: "2px 4px",
                        fontWeight: 500,
                        color: "#0066cc",
                    }}
                >
                    @{displayName}
                </span>
            );
        },
    }
);

/**
 * Type for mention inline content schema
 */
export type MentionInlineContentSchema = {
    mention: typeof mentionInlineContentSpec;
};

/**
 * Helper function to extend a schema with mention inline content
 */
export function withMentions<
    ISchema extends InlineContentSchema,
    SSchema extends StyleSchema,
>(
    inlineContentSpecs?: Record<string, any>
): Record<string, any> {
    return {
        ...inlineContentSpecs,
        mention: mentionInlineContentSpec,
    };
}
