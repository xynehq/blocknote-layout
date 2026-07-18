import React, { useState, useRef, useEffect } from "react";
import { createPortal } from "react-dom";

// Define themes locally to ensure they're always available
const THEMES = [
  { value: 'white', label: 'White' },
  { value: 'black', label: 'Black' },
  { value: 'beige', label: 'Beige' },
  { value: 'sky', label: 'Sky' },
];

export interface PresentToolbarProps {
  selectedTheme: string;
  onThemeChange: (event: React.ChangeEvent<HTMLSelectElement>) => void;
  onPresent: () => void;
  className?: string;
  /** Height of the button in pixels (default: 28) */
  height?: number;
  /** Size of icons in pixels (default: 14) */
  iconSize?: number;
  /** Font size in pixels (default: 12) */
  fontSize?: number;
}

export const PresentToolbar: React.FC<PresentToolbarProps> = ({
  selectedTheme,
  onThemeChange,
  onPresent,
  className = '',
  height = 28,
  iconSize = 14,
  fontSize = 12,
}) => {
  const [showThemeMenu, setShowThemeMenu] = useState(false);
  const [menuPosition, setMenuPosition] = useState({ top: 0, left: 0 });
  const buttonRef = useRef<HTMLButtonElement>(null);

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (buttonRef.current && !buttonRef.current.contains(event.target as Node)) {
        const dropdown = document.getElementById('present-toolbar-dropdown');
        if (dropdown && dropdown.contains(event.target as Node)) {
          return;
        }
        setShowThemeMenu(false);
      }
    };

    if (showThemeMenu) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [showThemeMenu]);

  const handleDropdownClick = () => {
    if (buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect();
      setMenuPosition({
        top: rect.bottom + 4,
        left: rect.right - 130,
      });
    }
    setShowThemeMenu(!showThemeMenu);
  };

  const handleThemeSelect = (value: string) => {
    const syntheticEvent = {
      target: { value },
      currentTarget: { value },
    } as React.ChangeEvent<HTMLSelectElement>;
    onThemeChange(syntheticEvent);
    setShowThemeMenu(false);
  };

  const currentThemeLabel = THEMES.find(t => t.value === selectedTheme)?.label || 'White';

  // Monitor/Presentation icon
  const PresentIcon = () => (
    <svg
      width={iconSize}
      height={iconSize}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <rect x="2" y="3" width="20" height="14" rx="2" ry="2" />
      <line x1="8" y1="21" x2="16" y2="21" />
      <line x1="12" y1="17" x2="12" y2="21" />
      <polygon points="10 7 10 13 15 10" fill="currentColor" stroke="none" />
    </svg>
  );

  // Chevron down icon
  const ChevronDownIcon = () => (
    <svg
      width={iconSize - 2}
      height={iconSize - 2}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <polyline points="6 9 12 15 18 9" />
    </svg>
  );

  // Checkmark icon
  const CheckIcon = () => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="20 6 9 17 4 12" />
    </svg>
  );

  // Dropdown menu rendered via portal
  const dropdownMenu = showThemeMenu ? createPortal(
    <div
      id="present-toolbar-dropdown"
      style={{
        position: 'fixed',
        top: menuPosition.top,
        left: menuPosition.left,
        zIndex: 99999,
      }}
      className="bg-white border border-gray-200 rounded-md shadow-lg min-w-[130px] overflow-hidden"
    >
      <div className="px-2.5 py-1.5 text-[10px] bg-gray-50 border-b border-gray-100 font-semibold text-gray-400 uppercase tracking-wide">
        Theme
      </div>
      {THEMES.map(theme => (
        <button
          key={theme.value}
          type="button"
          onClick={() => handleThemeSelect(theme.value)}
          className={`w-full text-left px-3 py-2 text-sm hover:bg-blue-50 transition-colors flex items-center justify-between ${selectedTheme === theme.value
              ? 'bg-blue-50 text-blue-600 font-medium'
              : 'text-gray-700'
            }`}
        >
          {theme.label}
          {selectedTheme === theme.value && <CheckIcon />}
        </button>
      ))}
    </div>,
    document.body
  ) : null;

  return (
    <>
      <div className={`bn-present-toolbar relative inline-flex ${className}`}>
        {/* Split Button Container */}
        <div
          className="inline-flex items-stretch border border-gray-200 rounded-md bg-white overflow-hidden shadow-sm hover:shadow transition-shadow"
          style={{ height: `${height}px` }}
        >
          {/* Left: Present Button */}
          <button
            type="button"
            className="px-2 flex items-center gap-1.5 text-gray-600 hover:bg-blue-50 hover:text-blue-600 transition-colors border-r border-gray-200"
            style={{ fontSize: `${fontSize}px` }}
            onClick={onPresent}
            title={`Present with ${currentThemeLabel} theme`}
          >
            <PresentIcon />
          </button>

          {/* Right: Dropdown Trigger */}
          <button
            ref={buttonRef}
            type="button"
            className="px-1.5 flex items-center justify-center text-gray-400 hover:bg-gray-50 hover:text-gray-600 transition-colors"
            onClick={handleDropdownClick}
            title="Select presentation theme"
          >
            <ChevronDownIcon />
          </button>
        </div>
      </div>
      {dropdownMenu}
    </>
  );
};
