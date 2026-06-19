import { createInlineContentSpec, InlineContentSchema, StyleSchema } from "@blocknote/core";
import { mentionConfig, getMentionDisplayName, MentionProps } from "./blocks/config.js";

export type { MentionProps } from "./blocks/config.js";
export { mentionConfig, getMentionDisplayName } from "./blocks/config.js";


export const mentionServerSpec = createInlineContentSpec(mentionConfig, {
    render: (inlineContent) => {
        const props = inlineContent.props as MentionProps;
        const displayName = getMentionDisplayName(props);

        const doc = (globalThis as { document?: Document }).document;
        if (!doc) {
            throw new Error(
                "mentionServerSpec.render requires a `document` (e.g. via JSDOM). " +
                    "Set `globalThis.document` before rendering on the server."
            );
        }

        const dom = doc.createElement("span");
        dom.setAttribute("data-inline-content-type", "mention");
        dom.style.backgroundColor = "rgba(0, 0, 0, 0.05)";
        dom.style.borderRadius = "4px";
        dom.style.padding = "2px 4px";
        dom.style.fontWeight = "500";
        dom.style.color = "#0066cc";
        dom.textContent = `@${displayName}`;

        return { dom };
    },
});

export type MentionServerInlineContentSchema = {
    mention: typeof mentionServerSpec;
};


export function withMentionsServer<
    ISchema extends InlineContentSchema,
    SSchema extends StyleSchema,
>(
    inlineContentSpecs?: Record<string, any>
): Record<string, any> {
    return {
        ...inlineContentSpecs,
        mention: mentionServerSpec,
    };
}
