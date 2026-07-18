import React, { useState, useCallback } from "react";
import { MdClose, MdZoomIn, MdZoomOut, MdCenterFocusStrong } from "react-icons/md";
import "../styles/slideshow.css";

interface ExpandedImageOverlayProps {
    imageSrc: string;
    onClose: () => void;
}

export const ExpandedImageOverlay: React.FC<ExpandedImageOverlayProps> = ({
    imageSrc,
    onClose,
}) => {
    // Track zoom and pan state for lightbox
    const [zoomLevel, setZoomLevel] = useState(1);
    const [panPosition, setPanPosition] = useState({ x: 0, y: 0 });
    const [isPanning, setIsPanning] = useState(false);
    const [panStart, setPanStart] = useState({ x: 0, y: 0 });

    // Zoom controls
    const handleZoomIn = useCallback(() => {
        setZoomLevel(prev => Math.min(prev + 0.5, 5));
    }, []);

    const handleZoomOut = useCallback(() => {
        setZoomLevel(prev => {
            const newZoom = Math.max(prev - 0.5, 1);
            if (newZoom === 1) setPanPosition({ x: 0, y: 0 });
            return newZoom;
        });
    }, []);

    const handleResetZoom = useCallback(() => {
        setZoomLevel(1);
        setPanPosition({ x: 0, y: 0 });
    }, []);

    const handleWheelZoom = useCallback((e: React.WheelEvent) => {
        e.preventDefault();
        const delta = e.deltaY > 0 ? -0.25 : 0.25;
        setZoomLevel(prev => {
            const newZoom = Math.max(1, Math.min(prev + delta, 5));
            if (newZoom === 1) setPanPosition({ x: 0, y: 0 });
            return newZoom;
        });
    }, []);

    // Pan handlers
    const handlePanStart = useCallback((e: React.MouseEvent) => {
        if (zoomLevel > 1) {
            setIsPanning(true);
            setPanStart({ x: e.clientX - panPosition.x, y: e.clientY - panPosition.y });
        }
    }, [zoomLevel, panPosition]);

    const handlePanMove = useCallback((e: React.MouseEvent) => {
        if (isPanning && zoomLevel > 1) {
            setPanPosition({ x: e.clientX - panStart.x, y: e.clientY - panStart.y });
        }
    }, [isPanning, zoomLevel, panStart]);

    const handlePanEnd = useCallback(() => setIsPanning(false), []);



    return (
        <div
            className="bn-expanded-image-overlay"
            onClick={onClose}
            onWheel={handleWheelZoom}
        >
            {/* Close button */}
            <button
                className="bn-expanded-image-close"
                onClick={onClose}
                title="Close"
            >
                <MdClose size={28} />
            </button>

            {/* Zoom controls */}
            <div className="bn-expanded-image-controls" onClick={(e) => e.stopPropagation()}>
                <button
                    className="bn-expanded-image-control-btn"
                    onClick={handleZoomOut}
                    disabled={zoomLevel <= 1}
                    title="Zoom Out"
                >
                    <MdZoomOut size={22} />
                </button>
                <span className="bn-expanded-image-zoom-level">{Math.round(zoomLevel * 100)}%</span>
                <button
                    className="bn-expanded-image-control-btn"
                    onClick={handleZoomIn}
                    disabled={zoomLevel >= 5}
                    title="Zoom In"
                >
                    <MdZoomIn size={22} />
                </button>
                <button
                    className="bn-expanded-image-control-btn"
                    onClick={handleResetZoom}
                    disabled={zoomLevel === 1}
                    title="Reset Zoom"
                >
                    <MdCenterFocusStrong size={22} />
                </button>
            </div>

            {/* Zoomable/Pannable image container */}
            <div
                className={`bn-expanded-image-container ${zoomLevel > 1 ? 'bn-expanded-image-draggable' : ''}`}
                onMouseDown={handlePanStart}
                onMouseMove={handlePanMove}
                onMouseUp={handlePanEnd}
                onMouseLeave={handlePanEnd}
                onClick={(e) => e.stopPropagation()}
            >
                <img
                    src={imageSrc}
                    alt="Expanded view"
                    className="bn-expanded-image-content"
                    style={{
                        transform: `scale(${zoomLevel}) translate(${panPosition.x / zoomLevel}px, ${panPosition.y / zoomLevel}px)`,
                        cursor: zoomLevel > 1 ? (isPanning ? 'grabbing' : 'grab') : 'default'
                    }}
                    draggable={false}
                />
            </div>

            {/* Zoom hint */}
            <div className="bn-expanded-image-hint">
                Use scroll wheel to zoom • {zoomLevel > 1 ? 'Drag to pan' : 'Click outside to close'}
            </div>
        </div>
    );
};
