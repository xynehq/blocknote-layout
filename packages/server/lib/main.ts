// React-free block and inline-content specs for server-side BlockNote use
// (e.g. with @blocknote/server-util). Schema-compatible with the interactive
// blocks: same types and props, minimal DOM renders, zero UI dependencies.
export * from "./whiteboard.js";
export * from "./genius.js";
export * from "./coderunner.js";
export * from "blocknote-layout-mentions/server";
