import { Node } from "@tiptap/core";
import { ReactNodeViewRenderer } from "@tiptap/react";
import WhiteboardNodeView from "../components/WhiteboardNodeView.js";

export const Whiteboard = Node.create({
    name: "whiteboard",
    group: "blockContent",
    content: "",
    draggable: true,

    addAttributes() {
        return {
            title: {
                default: "Untitled Whiteboard",
                parseHTML: (element) => element.getAttribute("data-title") || "Untitled Whiteboard",
                renderHTML: (attributes) => ({
                    "data-title": attributes.title as string,
                }),
            },
            data: {
                default: "{}",
                parseHTML: (element) => element.getAttribute("data-wb-data") || "{}",
                renderHTML: (attributes) => ({
                    "data-wb-data": attributes.data as string,
                }),
            },
            settings: {
                default: "{}",
                parseHTML: (element) => element.getAttribute("data-settings") || "{}",
                renderHTML: (attributes) => ({
                    "data-settings": attributes.settings as string,
                }),
            },
            collapsed: {
                default: "true",
                parseHTML: (element) => element.getAttribute("data-collapsed") || "true",
                renderHTML: (attributes) => ({
                    "data-collapsed": attributes.collapsed as string,
                }),
            },
        };
    },

    parseHTML() {
        return [
            {
                tag: "div[data-content-type=whiteboard]",
            },
        ];
    },

    renderHTML({ HTMLAttributes }) {
        const div = document.createElement('div');
        div.setAttribute('data-content-type', 'whiteboard');
        // CRITICAL: Apply all HTMLAttributes (including data-wb-data with whiteboard content)
        // Without this, attributes are lost during drag-drop serialization
        for (const [attribute, value] of Object.entries(HTMLAttributes)) {
            if (value !== null && value !== undefined) {
                div.setAttribute(attribute, value as string);
            }
        }
        return {
            dom: div,
            contentDOM: undefined,
        };
    },

    addNodeView() {
        return ReactNodeViewRenderer(WhiteboardNodeView);
    },
});
