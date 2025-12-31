import { NodeViewProps, NodeViewWrapper } from "@tiptap/react";
import { useRef, useCallback, useState, useEffect, useMemo } from "react";
import { createPortal } from "react-dom";
import { Excalidraw, MainMenu } from "@excalidraw/excalidraw";
import { MdClose } from "react-icons/md";
import "@excalidraw/excalidraw/index.css";

import { WhiteboardToolbar } from "./WhiteboardToolbar";
import "./styles.css";

export const WhiteboardNodeView = (props: NodeViewProps) => {
    const { node, updateAttributes } = props;
    
    // Extract attribute values directly to ensure React tracks changes for collaboration
    const titleAttr = (node.attrs.title as string) || 'Untitled Whiteboard';
    const collapsedAttr = node.attrs.collapsed;
    const isCollapsedValue = collapsedAttr === 'true' || collapsedAttr === true || collapsedAttr === undefined;
    
    const [isExpanded, setIsExpanded] = useState(false);
    const [fontsLoaded, setFontsLoaded] = useState(false);
    const [previewKey, setPreviewKey] = useState(0);
    const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);
    const isInitialLoadRef = useRef(true);
    const previewExcalidrawRef = useRef<any>(null);
    const editorExcalidrawRef = useRef<any>(null);

    // Track pending data for flush on unmount - CRITICAL for drag/drop
    const pendingDataRef = useRef<string | null>(null);
    const updateAttributesRef = useRef(updateAttributes);

    // Keep updateAttributes ref in sync
    useEffect(() => {
        updateAttributesRef.current = updateAttributes;
    }, [updateAttributes]);

    // Detect if mobile
    const isMobile = typeof window !== 'undefined' && window.innerWidth < 768;

    // Extract data attribute directly for proper reactivity
    const dataAttr = (node.attrs.data as string) || '{}';

    // Parse existing data - CRITICAL: Don't use convertToExcalidrawElements as it mutates positions
    // Use dataAttr instead of node.attrs.data for proper reactivity with Yjs
    const initialData = useMemo(() => {
        try {
            const parsed = typeof dataAttr === 'string'
                ? JSON.parse(dataAttr)
                : dataAttr;

            if (parsed && (parsed.elements || parsed.appState)) {
                // Return elements as-is, don't convert - conversion causes position drift
                return {
                    elements: parsed.elements || [],
                    appState: {
                        ...parsed.appState,
                        scrollToContent: false, // Prevent auto-centering that causes misalignment
                        scrollX: parsed.appState?.scrollX ?? 0,
                        scrollY: parsed.appState?.scrollY ?? 0,
                        zoom: parsed.appState?.zoom ?? { value: 1 },
                        showLibrary: false // Keep library closed in state
                    },
                    files: parsed.files || null,
                };
            }
        } catch (e) {
            console.error('WhiteboardNodeView: error parsing initial data', e);
        }
        return null;
    }, [dataAttr]);

    // Handle title change - update attributes directly for collaboration
    const handleTitleChange = useCallback((newTitle: string) => {
        if (updateAttributes) {
            updateAttributes({ title: newTitle });
        }
    }, [updateAttributes]);

    // Handle title blur
    const handleTitleBlur = useCallback(() => {
        if (titleAttr.trim() === '') {
            const defaultTitle = 'Untitled Whiteboard';
            if (updateAttributes) {
                updateAttributes({ title: defaultTitle });
            }
        }
    }, [titleAttr, updateAttributes]);

    // Handle preview Excalidraw initialization - center and zoom to fit content
    const handlePreviewMount = useCallback((api: any) => {
        previewExcalidrawRef.current = api;

        // Wait for canvas to be ready, then scroll to fit content
        setTimeout(() => {
            const elements = initialData?.elements;
            if (api && api.scrollToContent && elements && elements.length > 0) {
                api.scrollToContent(elements, {
                    fitToContent: true,
                    animate: false,
                    duration: 0,
                });
            }
        }, 100);
    }, [initialData?.elements]);

    // Handle whiteboard changes with debouncing
    const handleExcalidrawChange = useCallback((elements: readonly unknown[], appState: unknown, _files: unknown) => {
        // Block changes on mobile silently (View Only badge shows the status)
        if (isMobile) {
            return;
        }

        if (isInitialLoadRef.current) {
            return;
        }

        const typedAppState = appState as {
            viewBackgroundColor?: string;
            currentItemFontFamily?: number;
            currentItemFontSize?: number;
            currentItemStrokeWidth?: number;
            zoom?: { value: number };
            scrollX?: number;
            scrollY?: number;
        };
        const typedElements = elements as Array<{ isDeleted?: boolean }>;

        // Prepare data to save - excluding viewport (zoom/scroll) for independent user navigation
        const dataToSave = {
            elements: typedElements, // Save all elements including deleted ones
            appState: {
                viewBackgroundColor: typedAppState.viewBackgroundColor,
                currentItemFontFamily: typedAppState.currentItemFontFamily,
                currentItemFontSize: typedAppState.currentItemFontSize,
                currentItemStrokeWidth: typedAppState.currentItemStrokeWidth,
                // Don't save zoom, scrollX, scrollY - let each user navigate independently
            }
        };

        // Store pending data IMMEDIATELY for flush on unmount (before debounce)
        // This is CRITICAL for preserving data when block is dragged/repositioned
        const serializedData = JSON.stringify(dataToSave);
        pendingDataRef.current = serializedData;

        if (debounceTimerRef.current) {
            clearTimeout(debounceTimerRef.current);
        }

        debounceTimerRef.current = setTimeout(() => {
            if (updateAttributesRef.current) {
                try {
                    updateAttributesRef.current({
                        data: serializedData,
                    });
                    // Clear pending data after successful save
                    pendingDataRef.current = null;
                } catch (e) {
                    // Fail silently - data remains in pendingDataRef for potential retry
                }
            }
        }, 800);
    }, [isMobile]);

    // Font loading - CRITICAL to prevent element shifting
    useEffect(() => {
        const loadFonts = async () => {
            try {
                // Excalidraw uses these fonts - ensure they're loaded
                const fontFamilies = [
                    'Virgil',
                    'Cascadia',
                    'Assistant'
                ];

                // Wait for fonts to be ready
                if (document.fonts) {
                    await Promise.race([
                        document.fonts.ready,
                        new Promise(resolve => setTimeout(resolve, 2000)) // 2s timeout
                    ]);

                    // Additional check for Excalidraw-specific fonts
                    const fontChecks = fontFamilies.map(family =>
                        document.fonts.check(`12px ${family}`)
                    );

                    // Wait a bit more if fonts aren't ready
                    if (!fontChecks.every(Boolean)) {
                        await new Promise(resolve => setTimeout(resolve, 500));
                    }
                }

                setFontsLoaded(true);
            } catch (error) {
                console.warn('Font loading check failed, proceeding anyway:', error);
                setFontsLoaded(true);
            }
        };

        loadFonts();
    }, []);

    // Sync remote changes to Excalidraw editor and preview
    useEffect(() => {
        if (isInitialLoadRef.current || !initialData) {
            return;
        }

        // Update editor Excalidraw with new data from remote collaborators
        // Preserve current viewport - don't change zoom/scroll on remote updates
        if (editorExcalidrawRef.current) {
            try {
                const currentState = editorExcalidrawRef.current.getAppState();
                editorExcalidrawRef.current.updateScene({
                    elements: initialData.elements,
                    appState: {
                        ...initialData.appState,
                        zoom: currentState.zoom,
                        scrollX: currentState.scrollX,
                        scrollY: currentState.scrollY,
                    },
                });
            } catch (e) {
                // Silently fail - might happen if editor is not fully initialized
            }
        }

        // Update preview Excalidraw with new data from remote collaborators
        // Preserve current viewport - don't change zoom/scroll on remote updates
        if (previewExcalidrawRef.current) {
            try {
                const currentState = previewExcalidrawRef.current.getAppState();
                previewExcalidrawRef.current.updateScene({
                    elements: initialData.elements,
                    appState: {
                        ...initialData.appState,
                        zoom: currentState.zoom,
                        scrollX: currentState.scrollX,
                        scrollY: currentState.scrollY,
                    },
                });
            } catch (e) {
                // Silently fail - might happen if preview is not fully initialized
            }
        }
    }, [initialData]);

    // Initial load timer & Global UI cleanup
    useEffect(() => {
        const timer = setTimeout(() => {
            isInitialLoadRef.current = false;
        }, 1500);

        // Inject global nuclear CSS to kill unwanted UI elements
        // NOTE: Do NOT hide .App-toolbar or .island.App-toolbar as these are the main drawing tools!
        // NOTE: Do NOT hide footer as it contains useful zoom controls!
        const style = document.createElement('style');
        style.innerHTML = `
            .excalidraw .library-button, 
            .excalidraw button[aria-label*="library"], 
            .excalidraw button[aria-label*="Library"], 
            .excalidraw .App-menu__library-button,
            .excalidraw [data-testid="library-button"],
            .excalidraw .sidebar-trigger,
            .excalidraw .tt-button[aria-label="Library"],
            .excalidraw [data-testid="main-menu-trigger"],
            .excalidraw .App-menu-button,
            .excalidraw .tt-button[aria-label="Main menu"],
            .excalidraw .HelpButton,
            .excalidraw [data-testid="help-icon"],
            .excalidraw button[aria-label="Help"],
            .excalidraw .help-icon,
            .excalidraw .welcome-screen-center,
            .excalidraw .welcome-screen-menu-hints,
            .excalidraw .welcome-screen-shortcuts-hints,
            .excalidraw [class*="welcome-screen"],
            .excalidraw .layer-ui__wrapper__footer-center .Island,
            .excalidraw .scroll-back-to-content,
            .excalidraw [data-testid="scroll-back-to-content"],
            .excalidraw button[aria-label="Scroll back to content"] {
                display: none !important;
                visibility: hidden !important;
                opacity: 0 !important;
                pointer-events: none !important;
            }
        `;
        document.head.appendChild(style);

        return (): void => {
            clearTimeout(timer);

            // CRITICAL: Flush any pending data before unmount
            // This preserves whiteboard content when block is dragged/repositioned
            if (debounceTimerRef.current) {
                clearTimeout(debounceTimerRef.current);
                debounceTimerRef.current = null;
            }

            // If there's pending data that wasn't saved, save it now
            if (pendingDataRef.current && updateAttributesRef.current) {
                try {
                    updateAttributesRef.current({
                        data: pendingDataRef.current,
                    });
                    pendingDataRef.current = null;
                } catch (e) {
                    console.error('WhiteboardNodeView: failed to flush pending data on unmount', e);
                }
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
                    <button className="whiteboard-modal-close" onClick={() => {
                        setIsExpanded(false);
                        // Force preview to re-render with updated data
                        setPreviewKey(prev => prev + 1);
                    }}>
                        <MdClose size={20} />
                        <span>Close</span>
                    </button>
                    <div className="whiteboard-modal-breadcrumbs">
                        <span>{titleAttr}</span>
                    </div>
                    {isMobile && (
                        <div style={{
                            marginLeft: 'auto',
                            padding: '6px 12px',
                            background: 'rgba(255, 193, 7, 0.1)',
                            border: '1px solid rgba(255, 193, 7, 0.3)',
                            borderRadius: '6px',
                            fontSize: '12px',
                            color: '#f59e0b',
                            fontWeight: 500
                        }}>
                            View Only
                        </div>
                    )}
                </div>
                <div className="whiteboard-modal-content" style={{ position: 'relative' }}>
                    {!fontsLoaded ? (
                        <div style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            height: '100%',
                            color: '#64748b',
                            fontSize: '14px'
                        }}>
                            Loading whiteboard...
                        </div>
                    ) : (
                        <Excalidraw
                            initialData={initialData || undefined}
                            onChange={handleExcalidrawChange}
                            name={titleAttr}
                            renderTopRightUI={() => null}
                            detectScroll={true}
                            handleKeyboardGlobally={true}
                            viewModeEnabled={isMobile}
                            excalidrawAPI={(api) => {
                                editorExcalidrawRef.current = api;
                                // Auto-center content when editor opens for each user independently
                                setTimeout(() => {
                                    const elements = initialData?.elements;
                                    if (api && api.scrollToContent && elements && elements.length > 0) {
                                        api.scrollToContent(elements, {
                                            fitToContent: true,
                                            animate: false,
                                            duration: 0,
                                        });
                                    }
                                }, 150);
                            }}
                            UIOptions={{
                                canvasActions: {
                                    loadScene: false,
                                    saveToActiveFile: false,
                                    toggleTheme: !isMobile,
                                    saveAsImage: !isMobile,
                                    export: false,
                                    changeViewBackgroundColor: !isMobile,
                                }
                            }}
                        >
                            <MainMenu>
                                {!isMobile && (
                                    <>
                                        <MainMenu.DefaultItems.SaveAsImage />
                                        <MainMenu.DefaultItems.ClearCanvas />
                                        <MainMenu.DefaultItems.ChangeCanvasBackground />
                                        <MainMenu.DefaultItems.ToggleTheme />
                                        <MainMenu.DefaultItems.Help />
                                    </>
                                )}
                            </MainMenu>
                        </Excalidraw>
                    )}
                </div>
            </div>,
            document.body
        );
    };

    return (
        <NodeViewWrapper>
            <div className={`whiteboard-wrapper blocknote-whiteboard ${isCollapsedValue ? 'whiteboard-collapsed' : ''}`} data-content-type="whiteboard">
                <WhiteboardToolbar
                    title={titleAttr}
                    setTitle={handleTitleChange}
                    onTitleBlur={handleTitleBlur}
                    onExpand={() => setIsExpanded(true)}
                    isCollapsed={isCollapsedValue}
                    onToggleCollapse={() => {
                        const newCollapsed = !isCollapsedValue;
                        // Persist to node attributes so it survives drag-drop
                        if (updateAttributes) {
                            updateAttributes({ collapsed: newCollapsed ? 'true' : 'false' });
                        }
                    }}
                />

                {!isCollapsedValue && (
                    <div className="whiteboard-preview-container" onClick={() => setIsExpanded(true)}>
                        <div className="whiteboard-preview-placeholder">
                            {fontsLoaded && (
                                <Excalidraw
                                    key={`preview-${previewKey}`}
                                    initialData={initialData || undefined}
                                    viewModeEnabled={true}
                                    zenModeEnabled={true}
                                    gridModeEnabled={false}
                                    renderTopRightUI={() => null}
                                    excalidrawAPI={handlePreviewMount}
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
                            )}
                            <div className="whiteboard-preview-overlay">
                                <span>Continue Drawing</span>
                            </div>
                        </div>
                    </div>
                )}

                {renderFullEditor()}
            </div>
        </NodeViewWrapper>
    );
};

export default WhiteboardNodeView;
