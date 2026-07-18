import { createBlockSpec } from "@blocknote/core";

/**
 * React-free whiteboard block spec for server-side use (e.g. with
 * `@blocknote/server-util`). Schema-compatible with the interactive
 * `WhiteboardBlock`: same type and props, minimal DOM render.
 */
export const whiteboardServerSpec = createBlockSpec(
    {
        type: "whiteboard",
        propSchema: {
            title: {
                default: "Untitled Whiteboard",
            },
            data: {
                default: "{}",
            },
            settings: {
                default: "{}",
            },
            collapsed: {
                default: "true",
            },
        },
        content: "none",
    },
    {
        render: (block) => {
            const doc = (globalThis as { document?: Document }).document;
            if (!doc) {
                throw new Error(
                    "whiteboardServerSpec.render requires a `document` (e.g. via JSDOM). " +
                        "Set `globalThis.document` before rendering on the server."
                );
            }

            const dom = doc.createElement("div");
            dom.setAttribute("data-block-type", "whiteboard");
            dom.textContent = `[Whiteboard: ${block.props.title}]`;
            return { dom };
        },
    },
)();

export type WhiteboardServerBlockSchema = {
    whiteboard: typeof whiteboardServerSpec;
};

export const whiteboardServerBlockSpecs = {
    whiteboard: whiteboardServerSpec,
};
