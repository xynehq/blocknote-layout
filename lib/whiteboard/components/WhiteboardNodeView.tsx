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
    const [titleValue, setTitleValue] = useState(node.attrs.title || 'Untitled Whiteboard');
    const [isExpanded, setIsExpanded] = useState(false);
    const [isCollapsed, setIsCollapsed] = useState(true);
    const [fontsLoaded, setFontsLoaded] = useState(false);
    const [previewKey, setPreviewKey] = useState(0);
    const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);
    const isInitialLoadRef = useRef(true);
    const previewExcalidrawRef = useRef<any>(null);

    // Detect if mobile
    const isMobile = typeof window !== 'undefined' && window.innerWidth < 768;

    // Parse existing data - CRITICAL: Don't use convertToExcalidrawElements as it mutates positions
    const initialData = useMemo(() => {
        try {
            const parsed = typeof node.attrs.data === 'string'
                ? JSON.parse(node.attrs.data)
                : node.attrs.data;

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

        if (debounceTimerRef.current) {
            clearTimeout(debounceTimerRef.current);
        }

        debounceTimerRef.current = setTimeout(() => {
            if (updateAttributes) {
                try {
                    // Save elements exactly as they are - don't filter or transform
                    const dataToSave = {
                        elements: typedElements, // Save all elements including deleted ones
                        appState: {
                            viewBackgroundColor: typedAppState.viewBackgroundColor,
                            currentItemFontFamily: typedAppState.currentItemFontFamily,
                            currentItemFontSize: typedAppState.currentItemFontSize,
                            currentItemStrokeWidth: typedAppState.currentItemStrokeWidth,
                            zoom: typedAppState.zoom,
                            scrollX: typedAppState.scrollX,
                            scrollY: typedAppState.scrollY
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
    }, [updateAttributes, isMobile]);

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
            .excalidraw .layer-ui__wrapper .top-right-elements,
            .excalidraw .layer-ui__wrapper .top-left-elements,
            .excalidraw .App-menu_top,
            .excalidraw .App-menu-button,
            .excalidraw [data-testid="main-menu-trigger"],
            .excalidraw [data-testid="library-button"],
            .excalidraw .sidebar-trigger,
            .excalidraw .tt-button[aria-label="Library"],
            .excalidraw .tt-button[aria-label="Main menu"],
            .excalidraw .App-bottom-bar,
            .excalidraw .footer-center,
            .excalidraw .App-toolbar,
            .excalidraw .island.App-toolbar {
                display: none !important;
                visibility: hidden !important;
                opacity: 0 !important;
                pointer-events: none !important;
                width: 0 !important;
                height: 0 !important;
                padding: 0 !important;
                margin: 0 !important;
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
                    <button className="whiteboard-modal-close" onClick={() => {
                        setIsExpanded(false);
                        // Force preview to re-render with updated data
                        setPreviewKey(prev => prev + 1);
                    }}>
                        <MdClose size={20} />
                        <span>Close</span>
                    </button>
                    <div className="whiteboard-modal-breadcrumbs">
                        <span>{titleValue}</span>
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
                            name={titleValue}
                            renderTopRightUI={() => null}
                            detectScroll={false}
                            handleKeyboardGlobally={true}
                            viewModeEnabled={isMobile}
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
            <div className={`whiteboard-wrapper blocknote-whiteboard ${isCollapsed ? 'whiteboard-collapsed' : ''}`} data-content-type="whiteboard">
                <WhiteboardToolbar
                    title={titleValue}
                    setTitle={setTitleValue}
                    onTitleBlur={handleTitleBlur}
                    onExpand={() => setIsExpanded(true)}
                    isCollapsed={isCollapsed}
                    onToggleCollapse={() => setIsCollapsed(!isCollapsed)}
                />

                {!isCollapsed && (
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
