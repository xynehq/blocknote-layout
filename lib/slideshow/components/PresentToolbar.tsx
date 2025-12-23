import React, { useState, useRef, useEffect } from "react";
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
  const [showThemeMenu, setShowThemeMenu] = useState(false);
  const themeButtonRef = useRef<HTMLDivElement>(null);

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (themeButtonRef.current && !themeButtonRef.current.contains(event.target as Node)) {
        setShowThemeMenu(false);
      }
    };

    if (showThemeMenu) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [showThemeMenu]);

  return (
    <div className={`bn-present-toolbar ${className}`}>
      {/* Desktop View */}
      <div className="hidden md:flex items-center gap-2">
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

      {/* Mobile View */}
      <div className="flex md:hidden items-center gap-1.5" ref={themeButtonRef}>
        {/* Theme Button with Popup */}
        <div className="relative">
          <button
            className="bn-theme-button p-2 border border-gray-200 rounded bg-white text-gray-600 hover:bg-gray-50"
            onClick={() => setShowThemeMenu(!showThemeMenu)}
            aria-label="Select presentation theme"
            title="Theme"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10"/>
              <path d="M12 2a10 10 0 0 0 0 20"/>
            </svg>
          </button>

          {/* Theme Menu Popup */}
          {showThemeMenu && (
            <div className="absolute top-full right-0 mt-1 bg-white border border-gray-300 rounded-md shadow-lg z-50 min-w-[120px]">
              {PRESENTATION_THEMES.map(theme => (
                <button
                  key={theme.value}
                  onClick={() => {
                    const syntheticEvent = {
                      target: { value: theme.value }
                    } as React.ChangeEvent<HTMLSelectElement>;
                    onThemeChange(syntheticEvent);
                    setShowThemeMenu(false);
                  }}
                  className={`w-full text-left px-3 py-2 text-sm hover:bg-gray-100 first:rounded-t-md last:rounded-b-md ${
                    selectedTheme === theme.value ? 'bg-blue-50 text-blue-600 font-medium' : 'text-gray-700'
                  }`}
                >
                  {theme.label}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Present Button */}
        <button
          className="bn-present-button-mobile p-2 border border-gray-200 rounded bg-white text-gray-600 hover:bg-gray-50"
          onClick={onPresent}
          aria-label="Start presentation"
          title="Present"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <polygon points="5 3 19 12 5 21 5 3" />
          </svg>
        </button>
      </div>
    </div>
  );
};
