// ProseMirror nodes
export { Slide } from "./pm-nodes/Slide.js";
export { Slideshow } from "./pm-nodes/Slideshow.js";

// BlockNote specifications
export { SlideBlock, SlideshowBlock } from "./blocks/SlideshowBlocks.js";

// Schema integration
export {
  slideshowBlockSpecs,
  createSlideshowSchema,
  checkSlideshowBlocksInSchema,
  withSlideshow,
  slideshowSchema,
} from "./blocks/schema.js";

// Extensions and utilities
export { getSlideshowSlashMenuItems } from "./extensions/getSlideshowSlashMenuItems.js";
export { insertSlideshow } from "./extensions/getSlideshowSlashMenuItems.js";

// React components
export { SlideshowNode } from "./components/SlideshowNodeView.js";
export { SlideNodeView } from "./components/SlideNodeView.js";
export { PresentationModal } from "./components/PresentationModal.js";
