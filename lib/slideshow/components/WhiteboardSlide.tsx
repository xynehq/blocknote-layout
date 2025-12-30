import React, { useState, useMemo, useCallback, useRef, useEffect } from "react";
import { Excalidraw } from "@excalidraw/excalidraw";
import "@excalidraw/excalidraw/index.css";

interface WhiteboardSlideProps {
    data: {
        elements: any[];
        appState: any;
        files: any;
    };
    title?: string;
    theme?: string;
    isActive?: boolean;
}

// Get theme-specific settings
const getThemeSettings = (theme: string) => {
    switch (theme) {
        case 'black':
            return {
                excalidrawTheme: 'dark' as const,
            };
        case 'white':
        case 'beige':
        case 'sky':
        default:
            return {
                excalidrawTheme: 'light' as const,
            };
    }
};

/**
 * Renders an Excalidraw whiteboard in read-only mode for presentation slides.
 * Uses Excalidraw's built-in zoom-to-fit and scrollToContent for optimal viewing.
 */
export const WhiteboardSlide: React.FC<WhiteboardSlideProps> = ({
    data,
    title,
    theme = 'white',
    isActive = false,
}) => {
    const [dimensions, setDimensions] = useState({ width: 0, height: 0 });
    const [isReady, setIsReady] = useState(false);

    const excalidrawAPIRef = useRef<any>(null);
    const containerRef = useRef<HTMLDivElement>(null);
    const excalidrawContainerRef = useRef<HTMLDivElement>(null);

    const themeSettings = getThemeSettings(theme);

    // Prepare initial data with centered content
    const initialData = useMemo(() => {
        const visibleElements = (data.elements || []).filter((el: any) => !el.isDeleted);

        return {
            elements: visibleElements,
            appState: {
                ...data.appState,
                // Use transparent background so it blends with the slide theme
                viewBackgroundColor: 'transparent',
                theme: themeSettings.excalidrawTheme,
            },
            files: data.files || null,
            scrollToContent: true,
        };
    }, [data, themeSettings.excalidrawTheme]);

    // Monitor the Excalidraw container size (not the outer container with padding)
    useEffect(() => {
        const container = excalidrawContainerRef.current;
        if (!container) return;

        const resizeObserver = new ResizeObserver((entries) => {
            for (const entry of entries) {
                const { width, height } = entry.contentRect;
                if (width > 0 && height > 0) {
                    setDimensions({ width, height });
                }
            }
        });

        resizeObserver.observe(container);
        return () => resizeObserver.disconnect();
    }, []);

    const positionCanvas = useCallback(() => {
        const api = excalidrawAPIRef.current;
        if (!api) return;

        // Ensure dimensions are valid before trying to position
        if (dimensions.width <= 0 || dimensions.height <= 0) return;

        const elements = initialData.elements;
        if (!elements || elements.length === 0) return;

        // Reset ready state to trigger fade-in
        setIsReady(false);

        // Calculate bounding box of all visible elements
        let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
        for (const el of elements) {
            if (el.isDeleted) continue;
            const x = el.x ?? 0;
            const y = el.y ?? 0;
            const width = el.width ?? 0;
            const height = el.height ?? 0;
            if (x < minX) minX = x;
            if (y < minY) minY = y;
            if (x + width > maxX) maxX = x + width;
            if (y + height > maxY) maxY = y + height;
        }

        // If no valid bounds, exit
        if (!isFinite(minX) || !isFinite(maxX)) {
            setIsReady(true);
            return;
        }

        // Content dimensions
        const contentWidth = maxX - minX;
        const contentHeight = maxY - minY;

        // Padding around content
        const PADDING = 20;
        const paddedWidth = contentWidth + PADDING * 2;
        const paddedHeight = contentHeight + PADDING * 2;

        // Calculate zoom to fit content in viewport
        const zoomX = dimensions.width / paddedWidth;
        const zoomY = dimensions.height / paddedHeight;
        let targetZoom = Math.min(zoomX, zoomY);

        // Clamp zoom to reasonable bounds
        targetZoom = Math.max(0.5, Math.min(2.0, targetZoom));

        // Calculate content center
        const contentCenterX = minX + contentWidth / 2;
        const contentCenterY = minY + contentHeight / 2;

        // Calculate scroll to center content
        const viewportCenterX = dimensions.width / 2 / targetZoom;
        const viewportCenterY = dimensions.height / 2 / targetZoom;

        const scrollX = viewportCenterX - contentCenterX;
        const scrollY = viewportCenterY - contentCenterY;

        // Apply the scene update
        api.updateScene({
            appState: {
                ...api.getAppState(),
                zoom: { value: targetZoom },
                scrollX: scrollX,
                scrollY: scrollY,
            },
        });

        // Show canvas after setup
        setTimeout(() => setIsReady(true), 100);
    }, [dimensions, initialData.elements]);

    // Position canvas when slide becomes active
    useEffect(() => {
        if (isActive && excalidrawAPIRef.current && dimensions.width > 0) {
            // Small delay to ensure Reveal.js transition is complete
            const timer = setTimeout(() => {
                positionCanvas();
            }, 100);
            return () => clearTimeout(timer);
        }
    }, [isActive, dimensions.width, positionCanvas]);

    // Handle Excalidraw initialization
    const handleExcalidrawMount = useCallback((api: any) => {
        excalidrawAPIRef.current = api;

        // Position immediately on mount
        if (dimensions.width > 0) {
            setTimeout(positionCanvas, 50);
        }
    }, [positionCanvas, dimensions.width]);

    const hasContent = initialData.elements.length > 0;

    if (!hasContent) {
        return (
            <div className="whiteboard-slide-container whiteboard-empty" data-theme={theme}>
                {title && <div className="whiteboard-slide-title">{title}</div>}
                <p style={{ color: '#64748b', fontStyle: 'italic', fontSize: '1.5em' }}>
                    Empty Whiteboard
                </p>
            </div>
        );
    }

    // Stop propagation of events to Reveal.js to allow interaction
    const stopPropagation = (e: React.SyntheticEvent) => {
        e.stopPropagation();
    };

    return (
        <div
            ref={containerRef}
            className="whiteboard-slide-excalidraw-container"
            data-theme={theme}
            data-prevent-swipe
            onContextMenu={(e) => e.preventDefault()}
            // Explicitly stop specific events that Reveal might capture
            onKeyDown={stopPropagation}
            onMouseDown={stopPropagation}
            onPointerDown={stopPropagation}
            onTouchStart={stopPropagation}
            onWheel={stopPropagation}
        >
            {title && <div className="whiteboard-slide-title">{title}</div>}

            <div
                ref={excalidrawContainerRef}
                className="whiteboard-slide-excalidraw"
                style={{
                    opacity: isReady ? 1 : 0,
                    visibility: isReady ? 'visible' : 'hidden',
                    transition: 'opacity 0.2s ease',
                    background: 'transparent',
                    width: '100%',
                    height: '100%',
                    pointerEvents: 'auto' // Ensure events are captured
                }}
                onContextMenu={(e) => e.preventDefault()}
            >
                {/* Key on theme to remount on theme change */}
                <Excalidraw
                    key={theme}
                    initialData={initialData}
                    viewModeEnabled={true}
                    zenModeEnabled={false}
                    gridModeEnabled={false}
                    renderTopRightUI={() => null}
                    excalidrawAPI={handleExcalidrawMount}
                    theme={themeSettings.excalidrawTheme}
                    UIOptions={{
                        canvasActions: {
                            clearCanvas: false,
                            saveAsImage: false,
                            loadScene: false,
                            saveToActiveFile: false,
                            export: false,
                            toggleTheme: false,
                            changeViewBackgroundColor: false,
                        },
                    }}
                />
            </div>
        </div>
    );
};

export default WhiteboardSlide;
