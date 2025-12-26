// React components
export { PresentationModal } from "./components/PresentationModal.js";
export { PresentToolbar } from "./components/PresentToolbar.js";
export type { PresentToolbarProps } from "./components/PresentToolbar.js";

// Hooks
export { usePresentation, PRESENTATION_THEMES } from "./hooks/usePresentation.js";
export type {
  UsePresentationOptions,
  UsePresentationReturn,
  PresentationTheme
} from "./hooks/usePresentation.js";

// Utilities
export { generateSlidesFromBlocks } from "./utils/generateSlidesFromEditor.js";
export type { SlideContent, HtmlSlide, WhiteboardSlide } from "./utils/generateSlidesFromEditor.js";


