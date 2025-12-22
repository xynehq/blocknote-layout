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
        };
    },

    parseHTML() {
        return [
            {
                tag: "div[data-content-type=whiteboard]",
            },
        ];
    },

    renderHTML() {
        const div = document.createElement('div');
        div.setAttribute('data-content-type', 'whiteboard');
        return {
            dom: div,
            contentDOM: undefined,
        };
    },

    addNodeView() {
        return ReactNodeViewRenderer(WhiteboardNodeView);
    },
});
