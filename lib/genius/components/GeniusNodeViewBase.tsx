import { NodeViewWrapper } from "@tiptap/react";
import { useMemo, useState, useCallback, useRef, useEffect, JSX, ComponentType, ReactNode } from "react";
import { RiSparklingLine, RiSendPlaneFill } from "react-icons/ri";

/**
 * Minimal props interface for the GeniusNodeViewBase component.
 * This avoids version conflicts between the library and the consuming application.
 */
export interface GeniusNodeViewBaseProps {
    node: {
        attrs: Record<string, unknown>;
    };
    updateAttributes: (attrs: Record<string, unknown>) => void;
}

/**
 * Props for the tool output renderer component that will be provided by the consumer
 */
export interface ToolOutputRendererProps {
    toolOutput: unknown;
    className?: string | undefined;
}

/**
 * Result from the onSubmit callback
 */
export interface GeniusSubmitResult {
    content?: string;
    toolOutputs?: unknown[];
}

/**
 * Configuration for the GeniusNodeView component
 */
export interface GeniusNodeViewConfig {
    /**
     * Callback to handle query submission. Should return AI response.
     */
    onSubmit: (query: string) => Promise<GeniusSubmitResult>;

    /**
     * Component to render tool outputs (charts, tables, etc.)
     */
    ToolOutputRenderer?: ComponentType<ToolOutputRendererProps>;

    /**
     * Component to render markdown content
     */
    MarkdownRenderer?: ComponentType<{ source: string }>;

    /**
     * Custom button component. If not provided, uses default styling.
     */
    Button?: ComponentType<{
        onClick: () => void;
        disabled: boolean;
        loading?: boolean;
        children: ReactNode;
    }>;

    /**
     * Placeholder text for the input textarea
     */
    placeholder?: string;

    /**
     * Title text shown in header
     */
    title?: string;
}

// Store configuration
let geniusConfig: GeniusNodeViewConfig | null = null;

/**
 * Configure the Genius NodeView with custom handlers and components.
 * This should be called before rendering the editor.
 */
export function configureGeniusNodeViewConfig(config: GeniusNodeViewConfig): void {
    geniusConfig = config;
}

/**
 * Get the current configuration
 */
export function getGeniusNodeViewConfig(): GeniusNodeViewConfig | null {
    return geniusConfig;
}

/**
 * Parse tool outputs from JSON string
 */
function parseToolOutputs(dataAttr: string): unknown[] {
    try {
        if (!dataAttr || dataAttr === "{}" || dataAttr === "[]") return [];
        const parsed: unknown = typeof dataAttr === "string" ? JSON.parse(dataAttr) : dataAttr;
        if (!parsed) return [];
        if (Array.isArray(parsed)) return parsed;
        if (typeof parsed === "object" && parsed !== null && Object.keys(parsed as Record<string, unknown>).length > 0) {
            return [parsed];
        }
        return [];
    } catch {
        return [];
    }
}

/**
 * Default button component when no custom button is provided
 */
function DefaultButton({
    onClick,
    disabled,
    loading,
    children
}: {
    onClick: () => void;
    disabled: boolean;
    loading?: boolean;
    children: ReactNode;
}): JSX.Element {
    return (
        <button
            type="button"
            className="genius-block-submit"
            onClick={onClick}
            disabled={disabled}
        >
            {loading && <span className="genius-block-spinner" />}
            {children}
        </button>
    );
}

/**
 * Base GeniusNodeView component that can be used directly or extended
 */
export const GeniusNodeViewBase = (props: GeniusNodeViewBaseProps): JSX.Element => {
    const { node, updateAttributes } = props;
    const config = geniusConfig;

    // Extract attributes
    const dataAttr = (node.attrs["data"] as string) || "{}";
    const contentAttr = (node.attrs["content"] as string) || "";
    const titleAttr = (node.attrs["title"] as string) || "Genius Output";
    const queryAttr = (node.attrs["query"] as string) || "";
    const isLoadingAttr = (node.attrs["isLoading"] as boolean) || false;

    const [error, setError] = useState<string | null>(null);
    const textareaRef = useRef<HTMLTextAreaElement>(null);

    // Auto-focus on mount if no data
    useEffect(() => {
        const hasData = (dataAttr && dataAttr !== "{}" && dataAttr !== "[]") || contentAttr;
        if (!hasData && textareaRef.current) {
            setTimeout(() => {
                textareaRef.current?.focus();
            }, 100);
        }
    }, []);

    // Memoize tool outputs parsing
    const toolOutputs = useMemo(() => parseToolOutputs(dataAttr), [dataAttr]);

    const handleSubmit = useCallback(async (): Promise<void> => {
        if (!queryAttr.trim() || isLoadingAttr || !config?.onSubmit) return;

        updateAttributes({ isLoading: true });
        setError(null);

        try {
            const result = await config.onSubmit(queryAttr.trim());

            if (result.toolOutputs && result.toolOutputs.length > 0) {
                updateAttributes({
                    title: queryAttr.trim(),
                    data: JSON.stringify(result.toolOutputs),
                    content: result.content || "",
                    query: "",
                    isLoading: false,
                });
            } else if (result.content) {
                updateAttributes({
                    title: queryAttr.trim(),
                    content: result.content,
                    data: "{}",
                    query: "",
                    isLoading: false,
                });
            } else {
                setError("No response returned");
                updateAttributes({ isLoading: false });
            }
        } catch (err) {
            setError(err instanceof Error ? err.message : "Failed to get response");
            updateAttributes({ isLoading: false });
        }
    }, [queryAttr, isLoadingAttr, updateAttributes, config]);

    const handleKeyDown = useCallback(
        (e: React.KeyboardEvent<HTMLTextAreaElement>): void => {
            if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                void handleSubmit();
            }
        },
        [handleSubmit]
    );

    const hasData = toolOutputs.length > 0 || contentAttr;
    const ButtonComponent = config?.Button || DefaultButton;
    const ToolOutputRendererComponent = config?.ToolOutputRenderer;
    const MarkdownRendererComponent = config?.MarkdownRenderer;
    const placeholder = config?.placeholder || "Ask a question to generate charts, tables, or insights...";
    const headerTitle = config?.title || "Ask Genius";

    // Input mode - no data yet
    if (!hasData) {
        return (
            <NodeViewWrapper>
                <div className="genius-block-wrapper" data-content-type="genius">
                    <div className="genius-block-header">
                        <RiSparklingLine size={18} className="genius-block-icon-svg" />
                        <span className="genius-block-title">{headerTitle}</span>
                    </div>
                    <div
                        className="genius-block-input-area"
                        draggable={false}
                        onMouseDown={(e): void => e.stopPropagation()}
                        onKeyDown={(e): void => {
                            if (e.key === "Enter" || e.key === " ") {
                                e.stopPropagation();
                            }
                        }}
                        tabIndex={0}
                        role="textbox"
                    >
                        <textarea
                            ref={textareaRef}
                            className="genius-block-textarea"
                            placeholder={placeholder}
                            value={queryAttr}
                            onChange={(e): void => updateAttributes({ query: e.target.value })}
                            onKeyDown={handleKeyDown}
                            disabled={isLoadingAttr}
                            rows={2}
                        />
                        <div className="genius-block-actions">
                            {error && <span className="genius-block-error">{error}</span>}
                            <ButtonComponent
                                onClick={(): void => void handleSubmit()}
                                disabled={!queryAttr.trim() || isLoadingAttr}
                                loading={isLoadingAttr}
                            >
                                {!isLoadingAttr && <RiSendPlaneFill size={16} />}
                                {isLoadingAttr ? "Generating..." : "Generate"}
                            </ButtonComponent>
                        </div>
                    </div>
                </div>
            </NodeViewWrapper>
        );
    }

    // Display mode - has data
    return (
        <NodeViewWrapper>
            <div className="genius-block-wrapper" data-content-type="genius">
                <div className="genius-block-header">
                    <RiSparklingLine size={18} className="genius-block-icon-svg" />
                    <span className="genius-block-title">{titleAttr}</span>
                </div>
                <div
                    className="genius-block-content"
                    draggable={false}
                    onMouseDown={(e): void => e.stopPropagation()}
                    onKeyDown={(e): void => {
                        if (e.key === "Enter" || e.key === " ") {
                            e.stopPropagation();
                        }
                    }}
                    tabIndex={0}
                    role="textbox"
                >
                    {/* Display text content */}
                    {contentAttr && MarkdownRendererComponent && (
                        <div className="genius-block-text-content">
                            <MarkdownRendererComponent source={contentAttr} />
                        </div>
                    )}
                    {contentAttr && !MarkdownRendererComponent && (
                        <div className="genius-block-text-content">
                            <pre style={{ whiteSpace: "pre-wrap", fontFamily: "inherit" }}>{contentAttr}</pre>
                        </div>
                    )}

                    {/* Display tool outputs */}
                    {toolOutputs.length > 0 && ToolOutputRendererComponent && (
                        <div className="genius-block-outputs">
                            {toolOutputs.map((output, index) => (
                                <div key={index} className="genius-block-output-item">
                                    <ToolOutputRendererComponent
                                        toolOutput={output}
                                        className="border border-gray-200 rounded-lg"
                                    />
                                </div>
                            ))}
                        </div>
                    )}
                    {toolOutputs.length > 0 && !ToolOutputRendererComponent && (
                        <div className="genius-block-outputs">
                            <pre style={{ whiteSpace: "pre-wrap", fontSize: "12px" }}>
                                {JSON.stringify(toolOutputs, null, 2)}
                            </pre>
                        </div>
                    )}
                </div>
            </div>
        </NodeViewWrapper>
    );
};

export default GeniusNodeViewBase;
