// Genius block exports
export { Genius, configureGeniusNodeView } from "./pm-nodes/Genius.js";
export type { GeniusNodeViewProps } from "./pm-nodes/Genius.js";
export { GeniusBlock } from "./blocks/GeniusBlock.js";
export {
    geniusBlockSpecs,
    createGeniusSchema,
    withGenius,
    geniusSchema,
} from "./blocks/schema.js";
export { getGeniusSlashMenuItems, insertGenius } from "./extensions/getGeniusSlashMenuItems.js";

// Base component with dependency injection
export {
    GeniusNodeViewBase,
    configureGeniusNodeViewConfig,
    getGeniusNodeViewConfig
} from "./components/GeniusNodeViewBase.js";
export type {
    GeniusNodeViewBaseProps,
    GeniusNodeViewConfig,
    GeniusSubmitResult,
    ToolOutputRendererProps
} from "./components/GeniusNodeViewBase.js";

// Import CSS for side-effect (will be bundled)
import "./components/GeniusNodeView.css";
