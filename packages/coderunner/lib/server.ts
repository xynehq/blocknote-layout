import { createBlockSpec, defaultProps } from "@blocknote/core";

/**
 * React-free code runner block spec for server-side use (e.g. with
 * `@blocknote/server-util`). Schema-compatible with the interactive
 * `CodeBlock`: same type and props, minimal DOM render — no CodeMirror
 * on the server.
 */
export const codeRunnerServerSpec = createBlockSpec(
    {
        type: "codeRunner",
        propSchema: {
            ...defaultProps,
            language: {
                default: "python",
            },
            code: {
                default: "",
            },
            output: {
                default: "",
            },
            outputImages: {
                default: "",
            },
            status: {
                default: "idle",
            },
        },
        content: "none",
    },
    {
        render: (block) => {
            const doc = (globalThis as { document?: Document }).document;
            if (!doc) {
                throw new Error(
                    "codeRunnerServerSpec.render requires a `document` (e.g. via JSDOM). " +
                        "Set `globalThis.document` before rendering on the server."
                );
            }

            const dom = doc.createElement("pre");
            dom.setAttribute("data-block-type", "codeRunner");
            dom.textContent = block.props.code || `[Code: ${block.props.language}]`;
            return { dom };
        },
    },
)();

export type CodeRunnerServerBlockSchema = {
    codeRunner: typeof codeRunnerServerSpec;
};

export const codeRunnerServerBlockSpecs = {
    codeRunner: codeRunnerServerSpec,
};
