import { createBlockSpecFromTiptapNode } from "@blocknote/core";
import { Node } from "@tiptap/core";
import { Whiteboard } from "../pm-nodes/Whiteboard.js";

export const WhiteboardBlock = createBlockSpecFromTiptapNode(
    {
        node: Whiteboard as unknown as Node,
        type: "whiteboard",
        content: "none",
    },
    {
        title: {
            default: "Untitled Whiteboard",
        },
        data: {
            default: "{}",
        },
        settings: {
            default: "{}",
        },
    },
);
