import React, { useState, useMemo, useCallback, useRef } from "react";
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
}) => {
    const [isReady, setIsReady] = useState(false);
    const excalidrawAPIRef = useRef<any>(null);

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

    // Handle Excalidraw initialization - zoom to readable level from top-left
    const handleExcalidrawMount = useCallback((api: any) => {
        excalidrawAPIRef.current = api;

        // Wait a bit for the canvas to be ready, then position and zoom content
        setTimeout(() => {
            if (api && api.scrollToContent) {
                const elements = initialData.elements;

                // First, scroll to content to center it
                api.scrollToContent(elements, {
                    fitToContent: true,
                    animate: false,
                    duration: 0,
                });

                // Get current zoom after fit-to-content
                const appState = api.getAppState();
                const currentZoom = appState?.zoom?.value || 1;

                // If zoom is too small (content is very large), set a minimum readable zoom
                // and position from the top-left corner instead of centering
                const MIN_READABLE_ZOOM = 0.7; // 70% zoom minimum for readability

                if (currentZoom < MIN_READABLE_ZOOM) {
                    // Calculate the bounding box of all elements
                    let minX = Infinity, minY = Infinity;
                    for (const el of elements) {
                        if (el.x < minX) minX = el.x;
                        if (el.y < minY) minY = el.y;
                    }

                    // Set zoom to readable level and scroll to top-left of content
                    api.updateScene({
                        appState: {
                            ...appState,
                            zoom: { value: MIN_READABLE_ZOOM },
                            scrollX: -minX + 50, // Add some padding from the left
                            scrollY: -minY + 50, // Add some padding from the top
                        },
                    });
                }
            }
            setIsReady(true);
        }, 150);
    }, [initialData.elements]);

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

    return (
        <div
            className="whiteboard-slide-excalidraw-container"
            data-theme={theme}
            onContextMenu={(e) => e.preventDefault()}
        >
            {title && <div className="whiteboard-slide-title">{title}</div>}
            <div
                className="whiteboard-slide-excalidraw"
                style={{
                    opacity: isReady ? 1 : 0,
                    transition: 'opacity 0.3s ease',
                    background: 'transparent',
                }}
                onContextMenu={(e) => e.preventDefault()}
            >
                <Excalidraw
                    key={theme} // Force remount when theme changes to correctly apply dark/light mode
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
