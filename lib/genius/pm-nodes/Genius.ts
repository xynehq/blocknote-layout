import { Node } from "@tiptap/core";
import { ReactNodeViewRenderer } from "@tiptap/react";
import type { ComponentType } from "react";

// Type for the node view component that will be provided
export interface GeniusNodeViewProps {
    node: {
        attrs: {
            title: string;
            data: string;
            content: string;
            query: string;
            isLoading: boolean;
        };
    };
    updateAttributes: (attrs: Partial<{
        title: string;
        data: string;
        content: string;
        query: string;
        isLoading: boolean;
    }>) => void;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
let configuredNodeView: ComponentType<any> | null = null;

/**
 * Configure the Genius node with a custom NodeView component.
 * This should be called before creating the editor.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function configureGeniusNodeView(nodeView: ComponentType<any>): void {
    configuredNodeView = nodeView;
}

/**
 * Get the configured NodeView or a placeholder
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function getNodeView(): ComponentType<any> {
    if (!configuredNodeView) {
        // Return a placeholder component if not configured
        return function GeniusPlaceholder() {
            return null;
        };
    }
    return configuredNodeView;
}

export const Genius = Node.create({
    name: "genius",
    group: "blockContent",
    content: "",
    draggable: true,

    addAttributes() {
        const DATA_TITLE = "data-title";
        const DATA_GENIUS_DATA = "data-genius-data";
        const DATA_GENIUS_CONTENT = "data-genius-content";
        const DATA_QUERY = "data-query";
        const DATA_IS_LOADING = "data-is-loading";

        return {
            title: {
                default: "Genius Output",
                parseHTML: (element: HTMLElement): string =>
                    element.getAttribute(DATA_TITLE) || "Genius Output",
                renderHTML: (attributes: Record<string, unknown>): Record<string, string> => ({
                    [DATA_TITLE]: attributes["title"] as string,
                }),
            },
            data: {
                default: "{}",
                parseHTML: (element: HTMLElement): string =>
                    element.getAttribute(DATA_GENIUS_DATA) || "{}",
                renderHTML: (attributes: Record<string, unknown>): Record<string, string> => ({
                    [DATA_GENIUS_DATA]: attributes["data"] as string,
                }),
            },
            content: {
                default: "",
                parseHTML: (element: HTMLElement): string =>
                    element.getAttribute(DATA_GENIUS_CONTENT) || "",
                renderHTML: (attributes: Record<string, unknown>): Record<string, string> => ({
                    [DATA_GENIUS_CONTENT]: attributes["content"] as string,
                }),
            },
            query: {
                default: "",
                parseHTML: (element: HTMLElement): string =>
                    element.getAttribute(DATA_QUERY) || "",
                renderHTML: (attributes: Record<string, unknown>): Record<string, string> => ({
                    [DATA_QUERY]: attributes["query"] as string,
                }),
            },
            isLoading: {
                default: false,
                parseHTML: (element: HTMLElement): boolean =>
                    element.getAttribute(DATA_IS_LOADING) === "true",
                renderHTML: (attributes: Record<string, unknown>): Record<string, string> => ({
                    [DATA_IS_LOADING]: String(attributes["isLoading"]),
                }),
            },
        };
    },

    parseHTML() {
        return [
            {
                tag: "div[data-content-type=genius]",
            },
        ];
    },

    renderHTML({ HTMLAttributes: htmlAttributes }: { HTMLAttributes: Record<string, string> }) {
        const div = document.createElement("div");
        div.setAttribute("data-content-type", "genius");
        for (const [attribute, value] of Object.entries(htmlAttributes)) {
            if (value !== null && value !== undefined) {
                div.setAttribute(attribute, value);
            }
        }
        return { dom: div };
    },

    addNodeView() {
        return ReactNodeViewRenderer(getNodeView());
    },
});
