import { createReactInlineContentSpec } from "@blocknote/react";
import { InlineContentSchema, StyleSchema } from "@blocknote/core";

/**
 * Props for mention inline content
 */
export interface MentionProps {
    userId: string;
    username: string;
    userEmail: string;
    userPicture: string;
}

/**
 * Mention inline content spec
 * Renders as @username in the editor
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
        },
        content: "none",
    },
    {
        render: (props) => {
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
                    @{props.username}
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
