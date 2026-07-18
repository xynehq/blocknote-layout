import { createReactInlineContentSpec } from "@blocknote/react";
import { InlineContentSchema, StyleSchema } from "@blocknote/core";
import { mentionConfig, getMentionDisplayName, MentionProps } from "./config.js";

export type { MentionProps } from "./config.js";
export { mentionConfig, getMentionDisplayName } from "./config.js";

export const mentionInlineContentSpec = createReactInlineContentSpec(
    mentionConfig,
    {
        render: (props) => {
            const p = props.inlineContent.props as MentionProps;
            const displayName = getMentionDisplayName(p);
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
