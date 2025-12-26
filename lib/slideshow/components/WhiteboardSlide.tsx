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

    // Determine if we should use dark mode based on theme
    const isDarkMode = theme === 'black';

    // Prepare initial data with centered content
    const initialData = useMemo(() => {
        const visibleElements = (data.elements || []).filter((el: any) => !el.isDeleted);

        return {
            elements: visibleElements,
            appState: {
                ...data.appState,
                viewBackgroundColor: isDarkMode ? '#1a1a1a' : (data.appState?.viewBackgroundColor || '#ffffff'),
                theme: isDarkMode ? 'dark' : 'light',
            },
            files: data.files || null,
            scrollToContent: true,
        };
    }, [data, isDarkMode]);

    // Handle Excalidraw initialization and scroll to content
    const handleExcalidrawMount = useCallback((api: any) => {
        excalidrawAPIRef.current = api;

        // Wait a bit for the canvas to be ready, then scroll to content
        setTimeout(() => {
            if (api && api.scrollToContent) {
                api.scrollToContent(initialData.elements, {
                    fitToContent: true,
                    animate: false,
                    duration: 0,
                });
            }
            setIsReady(true);
        }, 150);
    }, [initialData.elements]);

    const hasContent = initialData.elements.length > 0;

    if (!hasContent) {
        return (
            <div className="whiteboard-slide-container whiteboard-empty">
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
            onContextMenu={(e) => e.preventDefault()}
        >
            {title && <div className="whiteboard-slide-title">{title}</div>}
            <div
                className="whiteboard-slide-excalidraw"
                style={{
                    opacity: isReady ? 1 : 0,
                    transition: 'opacity 0.3s ease',
                }}
                onContextMenu={(e) => e.preventDefault()}
            >
                <Excalidraw
                    initialData={initialData}
                    viewModeEnabled={true}
                    zenModeEnabled={true}
                    gridModeEnabled={false}
                    renderTopRightUI={() => null}
                    excalidrawAPI={handleExcalidrawMount}
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

