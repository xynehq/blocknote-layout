import React from "react";
import { PRESENTATION_THEMES } from "../hooks/usePresentation.js";

export interface PresentToolbarProps {
  selectedTheme: string;
  onThemeChange: (event: React.ChangeEvent<HTMLSelectElement>) => void;
  onPresent: () => void;
  className?: string;
}

export const PresentToolbar: React.FC<PresentToolbarProps> = ({
  selectedTheme,
  onThemeChange,
  onPresent,
  className = '',
}) => {
  return (
    <div className={`bn-present-toolbar flex items-center gap-2 ${className}`}>
      <select 
        className="bn-theme-select text-xs border border-gray-200 rounded px-2 py-1 bg-white text-gray-600 hover:bg-gray-50 focus:outline-none"
        value={selectedTheme}
        onChange={onThemeChange}
        title="Presentation Theme"
      >
        {PRESENTATION_THEMES.map((theme) => (
          <option key={theme.value} value={theme.value}>
            {theme.label}
          </option>
        ))}
      </select>
      <button 
        className="bn-present-button text-xs border border-gray-200 rounded px-2 py-1 bg-white text-gray-600 hover:bg-gray-50 transition-colors"
        onClick={onPresent}
        title="Present"
      >
        ▶ Present
      </button>
    </div>
  );
};
