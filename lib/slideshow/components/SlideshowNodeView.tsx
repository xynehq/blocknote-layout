import { ReactNodeViewRenderer, NodeViewProps, NodeViewWrapper } from '@tiptap/react';
import { Node } from '@tiptap/core';
import React, { useState, useEffect } from 'react';
import { PresentationModal } from './PresentationModal';
import { generateSlidesFromBlocks } from '../utils/generateSlidesFromEditor.js';
import '../styles/slideshow.css';

const SlideshowNodeView: React.FC<NodeViewProps> = ({ node, editor }) => {
  const [showPresentation, setShowPresentation] = useState(false);
  const [slideCount, setSlideCount] = useState(0);
  const [allSlides, setAllSlides] = useState<string[]>([]);
  const [selectedTheme, setSelectedTheme] = useState(node.attrs.theme || 'white');

  const updatePreview = () => {
    // Use the centralized slide generation logic
    const tiptapEditor = (editor as any)._tiptapEditor;
    if (!tiptapEditor) {
      console.error('Could not access tiptap editor');
      return;
    }

    const slides = generateSlidesFromBlocks({ _tiptapEditor: tiptapEditor } as any);
    setSlideCount(slides.length);
    setAllSlides(slides);
  };

  useEffect(() => {
    updatePreview();
  }, [node.attrs.canvasId]);

  useEffect(() => {
    if (node.attrs.theme && node.attrs.theme !== selectedTheme) {
      setSelectedTheme(node.attrs.theme);
    }
  }, [node.attrs.theme]);

  return (
    <NodeViewWrapper>
      <div className="bn-slideshow-node" contentEditable={false}>
        <div className="bn-slideshow-header">
          <div className="bn-slideshow-title">
            Slideshow
            {slideCount > 0 && <span className="bn-slide-count">({slideCount} slides)</span>}
          </div>
          <div className="bn-slideshow-actions">
            <select
              className="bn-slideshow-theme-select"
              value={selectedTheme}
              onChange={(e) => {
                setSelectedTheme(e.target.value);
                editor.commands.updateAttributes('slideshow', { theme: e.target.value });
              }}
            >
              <option value="white">White</option>
              <option value="black">Black</option>
              <option value="beige">Beige</option>
              <option value="sky">Sky</option>
            </select>
            <button onClick={() => { updatePreview(); setShowPresentation(true); }} className="bn-slideshow-btn">
              ▶ Present
            </button>
          </div>
        </div>
        {showPresentation && (
          <PresentationModal
            theme={selectedTheme}
            slides={allSlides}
            onClose={() => setShowPresentation(false)}
          />
        )}
      </div>
    </NodeViewWrapper>
  );
};

export const SlideshowNode = Node.create({
  name: 'slideshow',
  group: 'block',
  atom: true,
  draggable: true,

  addAttributes() {
    return {
      canvasId: { default: null },
      theme: { default: 'white' },
    };
  },

  parseHTML() {
    return [{ tag: 'div[data-type="slideshow"]' }];
  },

  renderHTML({ HTMLAttributes }) {
    return ['div', { 'data-type': 'slideshow', ...HTMLAttributes }, 0];
  },

  addNodeView() {
    return ReactNodeViewRenderer(SlideshowNodeView);
  },
});

export default SlideshowNodeView;
