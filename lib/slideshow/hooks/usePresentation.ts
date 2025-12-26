import React, { useState, useCallback } from "react";
import { BlockNoteEditor } from "@blocknote/core";
import { generateSlidesFromBlocks, SlideContent } from "../utils/generateSlidesFromEditor.js";

export interface UsePresentationOptions {
  editor: BlockNoteEditor<any, any, any> | null;
  defaultTheme?: string;
}

export interface UsePresentationReturn {
  // State
  selectedTheme: string;
  showPresentation: boolean;
  generatedSlides: SlideContent[];

  // Actions
  setSelectedTheme: (theme: string) => void;
  handleThemeChange: (event: React.ChangeEvent<HTMLSelectElement>) => void;
  handlePresent: () => Promise<void>;
  closePresentation: () => void;
}

export const PRESENTATION_THEMES = [
  { value: 'white', label: 'White' },
  { value: 'black', label: 'Black' },
  { value: 'beige', label: 'Beige' },
  { value: 'sky', label: 'Sky' },
] as const;

export type PresentationTheme = typeof PRESENTATION_THEMES[number]['value'];

export function usePresentation({
  editor,
  defaultTheme = 'white',
}: UsePresentationOptions): UsePresentationReturn {
  const [selectedTheme, setSelectedTheme] = useState<string>(defaultTheme);
  const [showPresentation, setShowPresentation] = useState(false);
  const [generatedSlides, setGeneratedSlides] = useState<SlideContent[]>([]);

  const handleThemeChange = useCallback((event: React.ChangeEvent<HTMLSelectElement>): void => {
    const newTheme = event.target.value;
    setSelectedTheme(newTheme);
    
    // Update all slideshow blocks with the new theme
    if (editor) {
      const blocks = editor.document as unknown[];
      blocks.forEach((block: unknown) => {
        // Runtime check for slideshow blocks
        if (
          typeof block === 'object' &&
          block !== null &&
          'type' in block &&
          (block as { type: string }).type === 'slideshow' &&
          'id' in block &&
          'props' in block
        ) {
          const blockId = (block as { id: string }).id;
          const blockProps = (block as { props: Record<string, unknown> }).props;
          editor.updateBlock(blockId, {
            type: 'slideshow',
            props: {
              ...blockProps,
              theme: newTheme,
            },
          } as any);
        }
      });
    }
  }, [editor]);

  const handlePresent = useCallback(async (): Promise<void> => {
    if (!editor) return;
    // Pass the editor instance so DOM elements can be cloned (preserves complex blocks)
    // This is now async to support whiteboard SVG generation
    const slides = await generateSlidesFromBlocks(editor);
    setGeneratedSlides(slides);
    setShowPresentation(true);
  }, [editor]);

  const closePresentation = useCallback((): void => {
    setShowPresentation(false);
    setGeneratedSlides([]);
  }, []);

  return {
    selectedTheme,
    showPresentation,
    generatedSlides,
    setSelectedTheme,
    handleThemeChange,
    handlePresent,
    closePresentation,
  };
}
