import { createBlockSpecFromTiptapNode } from "@blocknote/core";
import { Slide } from "../pm-nodes/Slide.js";
import { Slideshow } from "../pm-nodes/Slideshow.js";

export const SlideBlock = createBlockSpecFromTiptapNode(
  {
    node: Slide as any,
    type: "slide",
    content: "none",
  },
  {
    slideNumber: {
      default: 1,
    },
    notes: {
      default: "",
    },
  },
);

export const SlideshowBlock = createBlockSpecFromTiptapNode(
  {
    node: Slideshow as any,
    type: "slideshow",
    content: "inline",
  },
  {
    canvasId: {
      default: "" as string,
    },
    title: {
      default: "Untitled Slideshow",
    },
    theme: {
      default: "white",
    },
  },
);
