import { Node } from "@tiptap/core";
import { ReactNodeViewRenderer } from "@tiptap/react";
import { SlideNodeView } from "../components/SlideNodeView.js";

export const Slide = Node.create({
  name: "slide",
  group: "bnBlock childContainer",
  content: "blockContainer+",
  priority: 40,
  defining: true,
  marks: "deletion insertion modification",
  
  addAttributes() {
    return {
      slideNumber: {
        default: 1,
        parseHTML: (element) => {
          const attr = element.getAttribute("data-slide-number");
          if (attr === null) {
            return null;
          }

          const parsed = parseInt(attr);
          if (isFinite(parsed)) {
            return parsed;
          }

          return null;
        },
        renderHTML: (attributes) => ({
          "data-slide-number": (attributes.slideNumber as number).toString(),
        }),
      },
      notes: {
        default: "",
        parseHTML: (element) => {
          return element.getAttribute("data-notes") || "";
        },
        renderHTML: (attributes) => ({
          "data-notes": attributes.notes as string,
        }),
      },
    };
  },

  parseHTML() {
    return [
      {
        tag: "div",
        getAttrs: (element) => {
          if (typeof element === "string") {
            return false;
          }

          if (element.getAttribute("data-node-type") === this.name) {
            return {};
          }

          return false;
        },
      },
    ];
  },

  renderHTML({ HTMLAttributes }) {
    const slide = document.createElement("div");
    slide.className = "bn-slide";
    slide.setAttribute("data-node-type", this.name);

    for (const [attribute, value] of Object.entries(HTMLAttributes)) {
      slide.setAttribute(attribute, value as string);
    }

    return {
      dom: slide,
      contentDOM: slide,
    };
  },

  addNodeView() {
    return ReactNodeViewRenderer(SlideNodeView);
  },
});
