import { createBlockSpecFromTiptapNode } from "@blocknote/core";
import { Node } from "@tiptap/core";
import { Genius } from "../pm-nodes/Genius.js";

export const GeniusBlock = createBlockSpecFromTiptapNode(
    {
        node: Genius as unknown as Node,
        type: "genius",
        content: "none",
    },
    {
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
    },
);
