import React from "react";
import { MdOpenInFull } from "react-icons/md";

interface WhiteboardToolbarProps {
    title: string;
    setTitle: (title: string) => void;
    onTitleBlur: () => void;
    onExpand: () => void;
}

export const WhiteboardToolbar: React.FC<WhiteboardToolbarProps> = ({
    title,
    setTitle,
    onTitleBlur,
    onExpand,
}) => {
    return (
        <div className="whiteboard-toolbar">
            <input
                type="text"
                className="whiteboard-title-input"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                onBlur={onTitleBlur}
                placeholder="Untitled Whiteboard"
            />
            <button
                className="whiteboard-expand-button"
                onClick={onExpand}
                title="Expand to Full Screen"
            >
                <MdOpenInFull size={18} />
            </button>
        </div>
    );
};
