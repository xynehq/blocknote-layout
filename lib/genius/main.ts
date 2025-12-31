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

// Import CSS for side-effect (will be bundled)
import "./components/GeniusNodeView.css";
