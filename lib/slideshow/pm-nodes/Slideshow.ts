import { Node } from "@tiptap/core";
import { ReactNodeViewRenderer } from "@tiptap/react";
import SlideshowNodeView from "../components/SlideshowNodeView.js";

export const Slideshow = Node.create({
  name: "slideshow",
  group: "blockContent",
  content: "inline*",
  draggable: true,
  
  addAttributes() {
    return {
      canvasId: {
        default: null,
        parseHTML: (element) => {
          return element.getAttribute("data-canvas-id") || null;
        },
        renderHTML: (attributes) => {
          if (!attributes.canvasId) return {};
          return {
            "data-canvas-id": attributes.canvasId as string,
          };
        },
      },
      title: {
        default: "Slideshow",
        parseHTML: (element) => {
          return element.getAttribute("data-title") || "Slideshow";
        },
        renderHTML: (attributes) => ({
          "data-title": attributes.title as string,
        }),
      },
      theme: {
        default: "white",
        parseHTML: (element) => {
          return element.getAttribute("data-theme") || "white";
        },
        renderHTML: (attributes) => ({
          "data-theme": attributes.theme as string,
        }),
      },
    };
  },

  parseHTML() {
    return [
      {
        tag: "div[data-content-type=slideshow]",
      },
    ];
  },

  renderHTML({ HTMLAttributes }) {
    return ["div", { "data-content-type": "slideshow", ...HTMLAttributes }, 0];
  },

  addNodeView() {
    return ReactNodeViewRenderer(SlideshowNodeView);
  },
});
