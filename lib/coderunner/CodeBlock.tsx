import { createReactBlockSpec } from "@blocknote/react";
import {
  BlockNoteEditor,
  insertOrUpdateBlock,
  PropSchema,
  defaultProps,
  BlockConfig,
} from "@blocknote/core";
import { useMemo, useCallback, useState, useRef } from "react";
import { VscPlay, VscCode } from "react-icons/vsc";
import ReactCodeMirror, { EditorView } from "@uiw/react-codemirror";
import { Extension } from "@codemirror/state";
import { python } from "@codemirror/lang-python";
import { javascript } from "@codemirror/lang-javascript";
import { runPython, isPyodideLoaded, isPyodideLoading } from "./pyodide";
import { runJavaScript } from "./javascript";
import "./styles/code-runner.css";

const TYPE = "codeRunner" as const;

export type SupportedLanguage = "python" | "javascript";

const DEFAULT_PYTHON_CODE = `# Write your Python code here
print("Hello, World!")

# Try some calculations
result = sum(range(1, 11))
print(f"Sum of 1-10: {result}")`;

const DEFAULT_JAVASCRIPT_CODE = `// Write your JavaScript code here
console.log("Hello, World!");

// Try some calculations
const numbers = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
const sum = numbers.reduce((a, b) => a + b, 0);
console.log(\`Sum of 1-10: \${sum}\`);`;

const codeRunnerPropSchema = {
  ...defaultProps,
  language: {
    default: "python" as SupportedLanguage,
  },
  code: {
    default: DEFAULT_PYTHON_CODE as string,
  },
  output: {
    default: "" as string,
  },
  outputImages: {
    default: "" as string, 
  },
  status: {
    default: "idle" as string,
  },
} satisfies PropSchema;

export type CodeBlockProps = typeof codeRunnerPropSchema;

export const CodeBlock = createReactBlockSpec(
  {
    type: TYPE,
    propSchema: codeRunnerPropSchema,
    content: "none",
  },
  {
    render: ({ block, editor }) => {
      const isReadOnly = useMemo(() => !editor.isEditable, [editor]);
      const { language, code, output, outputImages, status } = block.props;
      const currentLanguage = (language as SupportedLanguage) || "python";

      const images: string[] = useMemo(() => {
        if (!outputImages) return [];
        try {
          return JSON.parse(outputImages);
        } catch {
          return [];
        }
      }, [outputImages]);

      const containerRef = useRef<HTMLDivElement>(null);

      const [isCollapsed, setIsCollapsed] = useState(false);
      const [isOutputCollapsed, setIsOutputCollapsed] = useState(false);
      const [isWrapped, setIsWrapped] = useState(false);
      const [isRunning, setIsRunning] = useState(false);
      const [runtimeStatus, setRuntimeStatus] = useState<"not-loaded" | "loading" | "ready">(
        currentLanguage === "python" 
          ? (isPyodideLoaded() ? "ready" : isPyodideLoading() ? "loading" : "not-loaded")
          : "ready"
      );

      const handleLanguageChange = useCallback((newLang: SupportedLanguage) => {
        const newCode = newLang === "python" ? DEFAULT_PYTHON_CODE : DEFAULT_JAVASCRIPT_CODE;
        editor.updateBlock(block, {
          props: { 
            ...block.props, 
            language: newLang, 
            code: newCode,
            output: "",
            outputImages: "",
            status: "idle" 
          },
        });
      }, [editor, block]);

      const handleCopy = useCallback(() => {
        navigator.clipboard.writeText(code);
      }, [code]);

      const onCodeChange = useCallback(
        (val: string) => {
          editor.updateBlock(block, {
            props: { ...block.props, code: val },
          });
        },
        [editor, block]
      );
      
      const handleRun = useCallback(async () => {
        if (isRunning) return;

        setIsRunning(true);
        if (currentLanguage === "python") {
          setRuntimeStatus("loading");
        }

        editor.updateBlock(block, {
          props: { ...block.props, status: "running", output: "Running..." },
        });

        try {
          const result = currentLanguage === "python" 
            ? await runPython(code)
            : await runJavaScript(code);
          
          if (currentLanguage === "python") {
            setRuntimeStatus("ready");
          }

          editor.updateBlock(block, {
            props: {
              ...block.props,
              status: result.success ? "success" : "error",
              output: result.error || result.output,
              outputImages: "images" in result && result.images ? JSON.stringify(result.images) : "",
            },
          });
        } catch (err) {
          editor.updateBlock(block, {
            props: {
              ...block.props,
              status: "error",
              output: `Execution failed: ${err}`,
            },
          });
        } finally {
          setIsRunning(false);
        }
      }, [code, editor, block, isRunning, currentLanguage]);

      const extensions = useMemo(() => {
         const langExtension = currentLanguage === "python" ? python() : javascript();
         const exts: Extension[] = [langExtension];
         if (isWrapped) {
            exts.push(EditorView.lineWrapping);
         }
         return exts;
      }, [isWrapped, currentLanguage]);

      return (
        <div
          ref={containerRef}
          className={`bn-code-runner-block ${isReadOnly ? "bn-code-runner-block--readonly" : ""}`}
        >
          {!isReadOnly && (
            <div className="bn-code-runner-header">
                <div className="bn-code-runner-header__left">
                    <select 
                      className="bn-code-runner-lang-select"
                      value={currentLanguage}
                      onChange={(e) => handleLanguageChange(e.target.value as SupportedLanguage)}
                    >
                      <option value="python">Python</option>
                      <option value="javascript">JavaScript</option>
                    </select>
                     {currentLanguage === "python" && runtimeStatus === "loading" && (
                        <span style={{ fontSize: "11px", color: "#666", marginLeft: 8 }}>
                            Loading Pyodide...
                        </span>
                    )}
                </div>
                
                <div className="bn-code-runner-toolbar">
                     <button 
                        className={`bn-code-runner-btn ${isWrapped ? "active" : ""}`}
                        onClick={() => setIsWrapped(!isWrapped)}
                        title="Toggle Wrap"
                     >
                        Wrap
                     </button>
                     <button 
                        className="bn-code-runner-btn"
                        onClick={handleCopy}
                        title="Copy Code"
                     >
                        Copy
                     </button>
                      <button 
                        className={`bn-code-runner-btn ${isCollapsed ? "active" : ""}`}
                        onClick={() => setIsCollapsed(!isCollapsed)}
                        title={isCollapsed ? "Expand" : "Collapse"}
                     >
                        {isCollapsed ? "Expand" : "Collapse"}
                     </button>
                     
                    <div className="bn-code-runner-separator" />

                    <button
                        className={`bn-code-runner-btn bn-code-runner-btn--run ${isRunning ? "running" : ""}`}
                        onClick={handleRun}
                        disabled={isRunning}
                    >
                        {isRunning ? "Running..." : "Run"}
                        {!isRunning && <VscPlay size={10} style={{ marginLeft: 4 }} />}
                    </button>
                </div>
            </div>
          )}

          {!isCollapsed && (
              <div className="bn-code-runner-content">
                <div className="bn-code-runner-editor">
                    <ReactCodeMirror
                        value={code}
                        onChange={!isReadOnly ? onCodeChange : undefined}
                        extensions={extensions}
                        theme="dark"
                        basicSetup={{
                        lineNumbers: true,
                        foldGutter: true,
                        syntaxHighlighting: true,
                        }}
                        editable={!isReadOnly}
                    />
                </div>

                {(output || images.length > 0 || status !== "idle") && (
                    <div className="bn-code-runner-output">
                    <div className="bn-code-runner-output__header">
                         <span className="bn-code-runner-output__label">Output</span>
                         <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                             {status === 'error' && <span className="bn-code-runner-status-dot error"></span>}
                             {status === 'success' && <span className="bn-code-runner-status-dot success"></span>}
                             <button 
                                 className="bn-code-runner-btn"
                                 onClick={() => setIsOutputCollapsed(!isOutputCollapsed)}
                                 style={{ padding: '2px 6px', fontSize: '10px' }}
                             >
                                 {isOutputCollapsed ? 'Show' : 'Hide'}
                             </button>
                         </div>
                    </div>
                    
                    {!isOutputCollapsed && (
                        <>
                            {images.length > 0 && (
                                <div className="bn-code-runner-output__images">
                                    {images.map((img, idx) => (
                                        <img 
                                            key={idx} 
                                            src={`data:image/png;base64,${img}`} 
                                            alt={`Plot ${idx + 1}`}
                                            className="bn-code-runner-output__image"
                                        />
                                    ))}
                                </div>
                            )}
                            
                            {output && (
                                <pre className={`bn-code-runner-output__content ${status === "error" ? "error" : ""}`}>
                                    {output}
                                </pre>
                            )}
                            
                            {!output && images.length === 0 && (
                                <pre className="bn-code-runner-output__content bn-code-runner-output__content--empty">
                                    No output.
                                </pre>
                            )}
                        </>
                    )}
                    </div>
                )}
              </div>
          )}
        </div>
      );
    },
  }
);

export const insertCode = () => ({
  title: "Code Runner",
  group: "Other",
  onItemClick: <BSchema extends Record<string, BlockConfig>>(
    editor: BlockNoteEditor<BSchema>
  ) => {
    insertOrUpdateBlock(editor, {
      type: TYPE,
    });
  },
  aliases: ["code", "python", "py", "javascript", "js", "run", "execute"],
  icon: <VscCode />,
  subtext: "Run Python or JavaScript code",
});

export const insertPythonCode = () => ({
  title: "Python Code",
  group: "Other",
  onItemClick: <BSchema extends Record<string, BlockConfig>>(
    editor: BlockNoteEditor<BSchema>
  ) => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    insertOrUpdateBlock(editor, {
      type: TYPE,
      props: { language: "python" },
    } as any);
  },
  aliases: ["python", "py"],
  icon: <VscCode />,
  subtext: "Run Python code in browser (Pyodide)",
});

export const insertJavaScriptCode = () => ({
  title: "JavaScript Code",
  group: "Other",
  onItemClick: <BSchema extends Record<string, BlockConfig>>(
    editor: BlockNoteEditor<BSchema>
  ) => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    insertOrUpdateBlock(editor, {
      type: TYPE,
      props: { language: "javascript" },
    } as any);
  },
  aliases: ["javascript", "js"],
  icon: <VscCode />,
  subtext: "Run JavaScript code in browser",
});
