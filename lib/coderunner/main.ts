export { CodeBlock, insertCode, insertPythonCode, insertJavaScriptCode } from "./CodeBlock.js";
export type { CodeBlockProps, SupportedLanguage } from "./CodeBlock.js";
export { runPython, getPyodide, isPyodideLoaded, isPyodideLoading } from "./pyodide.js";
export type { PythonResult } from "./pyodide.js";
export { runJavaScript } from "./javascript.js";
export type { JavaScriptResult } from "./javascript.js";

