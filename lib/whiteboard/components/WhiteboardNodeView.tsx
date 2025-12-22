import { NodeViewProps, NodeViewWrapper } from "@tiptap/react";
import { useRef, useCallback, useState, useEffect, useMemo } from "react";
import { createPortal } from "react-dom";
import { Excalidraw, convertToExcalidrawElements, MainMenu } from "@excalidraw/excalidraw";
import { MdClose, MdChevronRight } from "react-icons/md";
import "@excalidraw/excalidraw/index.css";

import { WhiteboardToolbar } from "./WhiteboardToolbar";
import "./styles.css";

export const WhiteboardNodeView = (props: NodeViewProps) => {
    const { node, updateAttributes } = props;
    const [titleValue, setTitleValue] = useState(node.attrs.title || 'Untitled Whiteboard');
    const [isExpanded, setIsExpanded] = useState(false);
    const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);
    const isInitialLoadRef = useRef(true);

    // Parse existing data
    const initialData = useMemo(() => {
        try {
            const parsed = typeof node.attrs.data === 'string'
                ? JSON.parse(node.attrs.data)
                : node.attrs.data;

            if (parsed && (parsed.elements || parsed.appState)) {
                return {
                    elements: convertToExcalidrawElements(parsed.elements || []),
                    appState: {
                        ...parsed.appState,
                        scrollToContent: true,
                        zoom: parsed.appState?.zoom || { value: 1 },
                        showLibrary: false // Keep library closed in state
                    },
                    files: parsed.files || null,
                };
            }
        } catch (e) {
            console.error('WhiteboardNodeView: error parsing initial data', e);
        }
        return null;
    }, [node.attrs.data]);

    // Handle title blur
    const handleTitleBlur = useCallback(() => {
        if (titleValue.trim() === '') {
            const defaultTitle = 'Untitled Whiteboard';
            setTitleValue(defaultTitle);
            if (updateAttributes) {
                updateAttributes({ title: defaultTitle });
            }
        } else if (updateAttributes) {
            updateAttributes({ title: titleValue });
        }
    }, [titleValue, updateAttributes]);

    // Handle whiteboard changes with debouncing
    const handleExcalidrawChange = useCallback((elements: readonly unknown[], appState: unknown, _files: unknown) => {
        if (isInitialLoadRef.current) {
            return;
        }

        const typedAppState = appState as { viewBackgroundColor?: string; currentItemFontFamily?: number; zoom?: { value: number } };
        const typedElements = elements as Array<{ isDeleted?: boolean }>;

        if (debounceTimerRef.current) {
            clearTimeout(debounceTimerRef.current);
        }

        debounceTimerRef.current = setTimeout(() => {
            if (updateAttributes) {
                try {
                    const dataToSave = {
                        elements: typedElements.filter(el => !el.isDeleted),
                        appState: {
                            viewBackgroundColor: typedAppState.viewBackgroundColor,
                            currentItemFontFamily: typedAppState.currentItemFontFamily,
                            zoom: typedAppState.zoom
                        }
                    };

                    updateAttributes({
                        data: JSON.stringify(dataToSave),
                    });
                } catch (e) {
                    // Fail silently
                }
            }
        }, 800);
    }, [updateAttributes]);

    // Initial load timer & Global UI cleanup
    useEffect(() => {
        const timer = setTimeout(() => {
            isInitialLoadRef.current = false;
        }, 1500);

        // Inject global nuclear CSS to kill the library button once and for all
        const style = document.createElement('style');
        style.innerHTML = `
            .excalidraw .library-button, 
            .excalidraw button[aria-label*="library"], 
            .excalidraw button[aria-label*="Library"], 
            .excalidraw .App-menu__library-button,
            .excalidraw .layer-ui__wrapper .top-right-elements > button:last-child {
                display: none !important;
                visibility: hidden !important;
            }
        `;
        document.head.appendChild(style);

        return (): void => {
            clearTimeout(timer);
            if (debounceTimerRef.current) {
                clearTimeout(debounceTimerRef.current);
            }
            if (style.parentNode) {
                document.head.removeChild(style);
            }
        };
    }, []);

    // Lock scroll when expanded
    useEffect(() => {
        if (isExpanded) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = '';
        }
        return () => {
            document.body.style.overflow = '';
        };
    }, [isExpanded]);

    const renderFullEditor = () => {
        if (!isExpanded) return null;

        return createPortal(
            <div className="whiteboard-modal-overlay">
                <div className="whiteboard-modal-header">
                    <button className="whiteboard-modal-close" onClick={() => setIsExpanded(false)}>
                        <MdClose size={20} />
                        <span>Close</span>
                    </button>
                    <div className="whiteboard-modal-breadcrumbs">
                        <span>Workspace</span>
                        <MdChevronRight size={16} />
                        <span>{titleValue}</span>
                    </div>
                </div>
                <div className="whiteboard-modal-content">
                    <Excalidraw
                        initialData={initialData || undefined}
                        onChange={handleExcalidrawChange}
                        name={titleValue}
                        renderTopRightUI={() => null}
                        UIOptions={{
                            canvasActions: {
                                loadScene: false,
                                saveToActiveFile: false,
                                toggleTheme: true,
                                saveAsImage: true,
                                export: false,
                                changeViewBackgroundColor: true,
                            }
                        }}
                    >
                        {/* Custom menu WITHOUT library to ensure it doesn't appear */}
                        <MainMenu>
                            <MainMenu.DefaultItems.SaveAsImage />
                            <MainMenu.DefaultItems.ClearCanvas />
                            <MainMenu.DefaultItems.ChangeCanvasBackground />
                            <MainMenu.DefaultItems.ToggleTheme />
                            <MainMenu.DefaultItems.Help />
                        </MainMenu>
                    </Excalidraw>
                </div>
            </div>,
            document.body
        );
    };

    return (
        <NodeViewWrapper>
            <div className="whiteboard-wrapper blocknote-whiteboard" data-content-type="whiteboard">
                <WhiteboardToolbar
                    title={titleValue}
                    setTitle={setTitleValue}
                    onTitleBlur={handleTitleBlur}
                    onExpand={() => setIsExpanded(true)}
                />

                <div className="whiteboard-preview-container" onClick={() => setIsExpanded(true)}>
                    <div className="whiteboard-preview-placeholder">
                        <Excalidraw
                            key={node.attrs.data}
                            initialData={initialData || undefined}
                            viewModeEnabled={true}
                            zenModeEnabled={true}
                            gridModeEnabled={false}
                            renderTopRightUI={() => null}
                            UIOptions={{
                                canvasActions: {
                                    clearCanvas: false,
                                    saveAsImage: false,
                                    loadScene: false,
                                    saveToActiveFile: false,
                                    export: false,
                                    toggleTheme: false,
                                    changeViewBackgroundColor: false,
                                }
                            }}
                        />
                        <div className="whiteboard-preview-overlay">
                            <span>Continue Drawing</span>
                        </div>
                    </div>
                </div>

                {renderFullEditor()}
            </div>
        </NodeViewWrapper>
    );
};

export default WhiteboardNodeView;
