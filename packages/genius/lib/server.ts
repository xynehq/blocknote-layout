import { createBlockSpec } from "@blocknote/core";

/**
 * React-free genius block spec for server-side use (e.g. with
 * `@blocknote/server-util`). Schema-compatible with the interactive
 * `GeniusBlock`: same type and props, minimal DOM render.
 */
export const geniusServerSpec = createBlockSpec(
    {
        type: "genius",
        propSchema: {
            title: {
                default: "Genius Output",
            },
            data: {
                default: "{}",
            },
            content: {
                default: "",
            },
            query: {
                default: "",
            },
            isLoading: {
                default: false,
            },
            botId: {
                default: "",
            },
            botName: {
                default: "",
            },
        },
        content: "none",
    },
    {
        render: (block) => {
            const doc = (globalThis as { document?: Document }).document;
            if (!doc) {
                throw new Error(
                    "geniusServerSpec.render requires a `document` (e.g. via JSDOM). " +
                        "Set `globalThis.document` before rendering on the server."
                );
            }

            const dom = doc.createElement("div");
            dom.setAttribute("data-block-type", "genius");
            dom.textContent = `[AI block: ${block.props.title}]`;
            return { dom };
        },
    },
)();

export type GeniusServerBlockSchema = {
    genius: typeof geniusServerSpec;
};

export const geniusServerBlockSpecs = {
    genius: geniusServerSpec,
};
