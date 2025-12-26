import React from "react";
import { MdOpenInFull, MdKeyboardArrowDown } from "react-icons/md";

interface WhiteboardToolbarProps {
    title: string;
    setTitle: (title: string) => void;
    onTitleBlur: () => void;
    onExpand: () => void;
    isCollapsed: boolean;
    onToggleCollapse: () => void;
}

export const WhiteboardToolbar: React.FC<WhiteboardToolbarProps> = ({
    title,
    setTitle,
    onTitleBlur,
    onExpand,
    isCollapsed,
    onToggleCollapse,
}) => {
    return (
        <div className="whiteboard-toolbar">
            <button
                className="whiteboard-collapse-button"
                onClick={onToggleCollapse}
                title={isCollapsed ? "Expand whiteboard" : "Collapse whiteboard"}
            >
                <MdKeyboardArrowDown
                    size={20}
                    style={{
                        transform: isCollapsed ? 'rotate(-90deg)' : 'rotate(0deg)',
                        transition: 'transform 0.2s ease'
                    }}
                />
            </button>
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
