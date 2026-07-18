// ProseMirror nodes
export { Whiteboard } from "./pm-nodes/Whiteboard.js";

// BlockNote specifications
export { WhiteboardBlock } from "./blocks/WhiteboardBlock.js";

// Schema integration
export {
    whiteboardBlockSpecs,
    createWhiteboardSchema,
    checkWhiteboardBlocksInSchema,
    withWhiteboard,
    whiteboardSchema,
} from "./blocks/schema.js";

// Extensions and utilities
export { getWhiteboardSlashMenuItems } from "./extensions/getWhiteboardSlashMenuItems.js";
export { insertWhiteboard } from "./extensions/getWhiteboardSlashMenuItems.js";

// React components
export { default as WhiteboardNodeView } from "./components/WhiteboardNodeView.js";
