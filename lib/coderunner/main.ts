export { CodeBlock, insertCode, insertPythonCode, insertJavaScriptCode } from "./CodeBlock.js";
export type { CodeBlockProps, SupportedLanguage } from "./CodeBlock.js";

// Runner configuration and utilities
export {
    executeCode,
    setCodeRunnerConfig,
    getCodeRunnerConfig,
    isRunnerAvailable,
    JUDGE0_LANGUAGE_IDS
} from "./runner.js";
export type { RunnerResult, CodeRunnerConfig } from "./runner.js";

// Language configuration
export {
    LANGUAGES,
    getSupportedLanguages,
    getLanguageConfig,
    getCodeMirrorExtension,
    getDefaultCode
} from "./languages.js";
export type { LanguageConfig } from "./languages.js";

