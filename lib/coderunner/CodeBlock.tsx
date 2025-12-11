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
import { runPython, isPyodideLoaded, isPyodideLoading } from "./pyodide";
import "./styles/code-runner.css";

const TYPE = "codeRunner" as const;

const DEFAULT_PYTHON_CODE = `# Write your Python code here
print("Hello, World!")

# Try some calculations
result = sum(range(1, 11))
print(f"Sum of 1-10: {result}")`;

// Prop schema for the code block
const codeRunnerPropSchema = {
  ...defaultProps,
  code: {
    default: DEFAULT_PYTHON_CODE as string,
  },
  output: {
    default: "" as string,
  },
  outputImages: {
    default: "" as string, // JSON stringified array of base64 images
  },
  status: {
    default: "idle" as string, // idle | running | success | error
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
      const { code, output, outputImages, status } = block.props;

      // Parse images from JSON string
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
      const [pyodideStatus, setPyodideStatus] = useState<"not-loaded" | "loading" | "ready">(
        isPyodideLoaded() ? "ready" : isPyodideLoading() ? "loading" : "not-loaded"
      );

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
        setPyodideStatus("loading");

        editor.updateBlock(block, {
          props: { ...block.props, status: "running", output: "Running..." },
        });

        try {
          const result = await runPython(code);
          setPyodideStatus("ready");

          editor.updateBlock(block, {
            props: {
              ...block.props,
              status: result.success ? "success" : "error",
              output: result.error || result.output,
              outputImages: result.images ? JSON.stringify(result.images) : "",
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
      }, [code, editor, block, isRunning]);

      // Python extension for CodeMirror
      const pythonExtension = python();
      
      // Editor Line Wrapping Extension
      const extensions = useMemo(() => {
         const exts: Extension[] = [pythonExtension];
         if (isWrapped) {
            exts.push(EditorView.lineWrapping);
         }
         return exts;
      }, [isWrapped, pythonExtension]);

      return (
        <div
          ref={containerRef}
          className={`bn-code-runner-block ${isReadOnly ? "bn-code-runner-block--readonly" : ""}`}
        >
          {/* Minimal Toolbar / Header */}
          {!isReadOnly && (
            <div className="bn-code-runner-header">
                <div className="bn-code-runner-header__left">
                    <span className="bn-code-runner-lang-badge">Python</span>
                     {pyodideStatus === "loading" && (
                        <span style={{ fontSize: "11px", color: "#666", marginLeft: 8 }}>
                            Loading...
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

          {/* Code Editor Area */}
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

                 {/* Output Panel */}
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
                            {/* Render images first */}
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
                            
                            {/* Text output */}
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

/**
 * Creates a slash menu item for inserting a Python code block
 */
export const insertCode = () => ({
  title: "Python Code",
  group: "Other",
  onItemClick: <BSchema extends Record<string, BlockConfig>>(
    editor: BlockNoteEditor<BSchema>
  ) => {
    insertOrUpdateBlock(editor, {
      type: TYPE,
    });
  },
  aliases: ["code", "python", "py", "run", "execute"],
  icon: <VscCode />,
  subtext: "Run Python code in the browser",
});
