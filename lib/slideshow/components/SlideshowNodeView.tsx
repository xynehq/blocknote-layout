import { ReactNodeViewRenderer, NodeViewProps, NodeViewWrapper } from '@tiptap/react';
import { Node } from '@tiptap/core';
import React, { useState, useEffect } from 'react';
import { PresentationModal } from './PresentationModal';
import '../styles/slideshow.css';

// Maximum blocks per slide before forcing a split (safety net)
const MAX_BLOCKS_PER_SLIDE = 15;

const SlideshowNodeView: React.FC<NodeViewProps> = ({ node, editor }) => {
  const [showPresentation, setShowPresentation] = useState(false);
  const [slideCount, setSlideCount] = useState(0);
  const [allSlides, setAllSlides] = useState<string[]>([]);
  const [selectedTheme, setSelectedTheme] = useState(node.attrs.theme || 'white');

  // Extract text content from inline content
  const extractText = (content: any[]): string => {
    if (!content) return '';
    return content.map((item: any) => {
      if (typeof item === 'string') return item;
      if (item.type === 'text') return item.text || '';
      if (item.type === 'link') return extractText(item.content || []);
      return '';
    }).join('');
  };

  // Check if a block is a manual separator (---, ***, ___, or divider block)
  const isManualSeparator = (block: any): boolean => {
    if (block.type === 'horizontalRule' || block.type === 'divider') {
      return true;
    }
    if (block.type === 'paragraph') {
      const text = extractText(block.content).trim();
      return text === '---' || text === '***' || text === '—' || text === '___' || text === '- - -';
    }
    return false;
  };

  // Get heading level (0 if not a heading)
  const getHeadingLevel = (block: any): number => {
    if (block.type !== 'heading') return 0;
    return block.props?.level || 1;
  };

  // Check if H2s are nested under H1s
  const hasNestedStructure = (blocks: any[]): boolean => {
    let foundH1 = false;
    for (const block of blocks) {
      const level = getHeadingLevel(block);
      if (level === 1) foundH1 = true;
      if (level === 2 && !foundH1) return false;
    }
    return foundH1 && blocks.some(b => getHeadingLevel(b) === 2);
  };

  // STEP 1: Split by --- markers (ALWAYS first)
  const splitByMarkers = (blocks: any[]): any[][] => {
    const sections: any[][] = [];
    let current: any[] = [];

    for (const block of blocks) {
      if (isManualSeparator(block)) {
        if (current.length > 0) {
          sections.push(current);
          current = [];
        }
      } else {
        current.push(block);
      }
    }
    if (current.length > 0) sections.push(current);
    return sections.length > 0 ? sections : [blocks];
  };

  // STEP 2: Split by headings (H1 or H2)
  const splitByHeadings = (blocks: any[]): any[][] => {
    const hasH1 = blocks.some(b => getHeadingLevel(b) === 1);
    const hasH2 = blocks.some(b => getHeadingLevel(b) === 2);
    
    if (!hasH1 && !hasH2) return [blocks]; // No headings, keep as one
    
    const nested = hasNestedStructure(blocks);
    const sections: any[][] = [];
    let current: any[] = [];
    let firstH2UnderCurrentH1 = true;

    for (let i = 0; i < blocks.length; i++) {
      const block = blocks[i];
      const level = getHeadingLevel(block);

      if (nested) {
        // Nested: H1 starts slide, first H2 stays, rest of H2s start new slides
        if (level === 1) {
          if (current.length > 0) sections.push(current);
          current = [block];
          firstH2UnderCurrentH1 = true;
        } else if (level === 2) {
          if (firstH2UnderCurrentH1) {
            current.push(block);
            firstH2UnderCurrentH1 = false;
          } else {
            if (current.length > 0) sections.push(current);
            current = [block];
          }
        } else {
          current.push(block);
        }
      } else {
        // Flat: split on H1 if exists, else on H2
        const splitLevel = hasH1 ? 1 : 2;
        if (level === splitLevel && i > 0) {
          if (current.length > 0) sections.push(current);
          current = [block];
        } else {
          current.push(block);
        }
      }
    }
    if (current.length > 0) sections.push(current);
    return sections.length > 0 ? sections : [blocks];
  };

  // STEP 3: Split very long sections by block count (safety net)
  const splitLongSection = (blocks: any[]): any[][] => {
    if (blocks.length <= MAX_BLOCKS_PER_SLIDE) return [blocks];
    
    const slides: any[][] = [];
    let current: any[] = [];
    
    for (let i = 0; i < blocks.length; i++) {
      const block = blocks[i];
      current.push(block);
      
      if (current.length >= MAX_BLOCKS_PER_SLIDE) {
        const nextBlock = blocks[i + 1];
        const isGoodBreak = !nextBlock || 
          getHeadingLevel(nextBlock) > 0 || 
          (block.type !== 'bulletListItem' && block.type !== 'numberedListItem');
        
        if (isGoodBreak) {
          slides.push(current);
          current = [];
        }
      }
    }
    if (current.length > 0) slides.push(current);
    return slides;
  };

  // Main splitting function - cascading logic
  const splitIntoSlides = (): any[][] => {
    const docContent: any[] = [];
    
    editor.state.doc.descendants((node: any) => {
      if (node.type.name === 'blockContainer' && node.firstChild) {
        const blockNode = node.firstChild;
        const attrs = { ...blockNode.attrs };
        let blockData: any = {
          type: blockNode.type.name,
          props: attrs,
          content: extractInlineContent(blockNode.content),
          children: []
        };
        if (blockNode.type.name === 'table') {
          blockData = extractTableContent(blockNode);
          blockData.props = attrs;
        }
        docContent.push(blockData);
      }
    });

    const allBlocks = docContent.filter((b: any) => b.type !== 'slideshow');
    if (allBlocks.length === 0) {
      return [[{ type: 'paragraph', content: [{ type: 'text', text: 'Empty Canvas' }] }]];
    }

    // STEP 1: Split by --- markers first (ALWAYS)
    const markerSections = splitByMarkers(allBlocks);

    // STEP 2 & 3: For each section, apply heading split if too long, then block count split
    const finalSlides: any[][] = [];
    
    for (const section of markerSections) {
      if (section.length === 0) continue;
      
      // If section is too long, try splitting by headings first
      if (section.length > MAX_BLOCKS_PER_SLIDE) {
        const headingSections = splitByHeadings(section);
        
        // For each heading section, split by block count if still too long
        for (const headingSection of headingSections) {
          if (headingSection.length > MAX_BLOCKS_PER_SLIDE) {
            const blockSections = splitLongSection(headingSection);
            finalSlides.push(...blockSections);
          } else {
            finalSlides.push(headingSection);
          }
        }
      } else {
        // Section is small enough, keep as is
        finalSlides.push(section);
      }
    }

    return finalSlides.length > 0 ? finalSlides : [[{ type: 'paragraph', content: [{ type: 'text', text: 'Empty Canvas' }] }]];
  };

  const extractInlineContent = (content: any): any[] => {
    if (!content) return [];
    const nodes: any[] = [];
    if (content.content) {
      content.content.forEach((node: any) => nodes.push(node));
    }
    return nodes.map((node: any) => {
      if (node.type.name === 'text') {
        const styles: any = {};
        if (node.marks) {
          node.marks.forEach((mark: any) => {
            if (mark.type.name === 'bold') styles.bold = true;
            if (mark.type.name === 'italic') styles.italic = true;
            if (mark.type.name === 'underline') styles.underline = true;
            if (mark.type.name === 'strike') styles.strike = true;
            if (mark.type.name === 'code') styles.code = true;
            if (mark.type.name === 'textStyle' && mark.attrs.color) styles.textColor = mark.attrs.color;
            if (mark.type.name === 'backgroundColor') styles.backgroundColor = mark.attrs.backgroundColor;
            if (mark.type.name === 'link') {
              return { type: 'link', href: mark.attrs.href, content: [{ type: 'text', text: node.text, styles }] };
            }
          });
        }
        return { type: 'text', text: node.text, styles };
      }
      return { type: 'text', text: '' };
    });
  };

  const extractTableContent = (tableNode: any): any => {
    const rows: any[] = [];
    tableNode.content.forEach((row: any) => {
      const cells: any[] = [];
      row.content.forEach((cell: any) => {
        cells.push({ content: extractInlineContent(cell.content.firstChild) });
      });
      rows.push({ cells });
    });
    return { type: 'table', rows };
  };

  const renderInlineContent = (content: any[]): string => {
    if (!content) return '';
    return content.map((item: any) => {
      if (typeof item === 'string') return item;
      if (item.type === 'text') {
        let text = item.text || '';
        const styles = item.styles || {};
        if (styles.bold) text = `<strong>${text}</strong>`;
        if (styles.italic) text = `<em>${text}</em>`;
        if (styles.underline) text = `<u>${text}</u>`;
        if (styles.strike) text = `<s>${text}</s>`;
        if (styles.code) text = `<code class="bn-inline-code">${text}</code>`;
        if (styles.textColor) text = `<span style="color: ${styles.textColor}">${text}</span>`;
        if (styles.backgroundColor) text = `<span style="background-color: ${styles.backgroundColor}">${text}</span>`;
        return text;
      }
      if (item.type === 'link') {
        return `<a href="${item.href}" target="_blank">${renderInlineContent(item.content || [])}</a>`;
      }
      return '';
    }).join('');
  };

  const renderBlock = (block: any): string => {
    if (block.type === 'heading') {
      const level = block.props?.level || 1;
      return `<h${level} class="bn-heading">${renderInlineContent(block.content)}</h${level}>`;
    }
    if (block.type === 'paragraph') {
      return `<p class="bn-paragraph">${renderInlineContent(block.content)}</p>`;
    }
    if (block.type === 'bulletListItem') {
      return `<li class="bn-list-item">${renderInlineContent(block.content)}</li>`;
    }
    if (block.type === 'numberedListItem') {
      return `<li class="bn-list-item bn-numbered">${renderInlineContent(block.content)}</li>`;
    }
    if (block.type === 'codeBlock') {
      const lang = block.props?.language || '';
      return `<pre class="bn-code-block"><code class="language-${lang}">${extractText(block.content)}</code></pre>`;
    }
    if (block.type === 'table' && block.rows) {
      let html = '<table class="bn-table"><tbody>';
      block.rows.forEach((row: any) => {
        html += '<tr>';
        row.cells.forEach((cell: any) => {
          html += `<td>${renderInlineContent(cell.content)}</td>`;
        });
        html += '</tr>';
      });
      return html + '</tbody></table>';
    }
    if (block.type === 'quote') {
      return `<blockquote class="bn-quote">${renderInlineContent(block.content)}</blockquote>`;
    }
    if (block.type === 'image') {
      return `<img src="${block.props?.url || ''}" alt="${block.props?.caption || ''}" class="bn-image" />`;
    }
    return '';
  };

  const renderSlide = (blocks: any[]): string => {
    let html = '';
    let inList = false;
    let listType = '';

    blocks.forEach((block: any) => {
      if (block.type === 'bulletListItem') {
        if (!inList || listType !== 'ul') {
          if (inList) html += listType === 'ol' ? '</ol>' : '</ul>';
          html += '<ul class="bn-list">';
          listType = 'ul';
          inList = true;
        }
        html += renderBlock(block);
      } else if (block.type === 'numberedListItem') {
        if (!inList || listType !== 'ol') {
          if (inList) html += listType === 'ol' ? '</ol>' : '</ul>';
          html += '<ol class="bn-list">';
          listType = 'ol';
          inList = true;
        }
        html += renderBlock(block);
      } else {
        if (inList) {
          html += listType === 'ol' ? '</ol>' : '</ul>';
          inList = false;
        }
        html += renderBlock(block);
      }
    });
    if (inList) html += listType === 'ol' ? '</ol>' : '</ul>';
    return html;
  };

  const updatePreview = () => {
    const slides = splitIntoSlides();
    setSlideCount(slides.length);
    
    const editorContainer = editor.view.dom;
    const allBlockElements = Array.from(editorContainer.querySelectorAll('.bn-block-outer'));
    const blockMap = new Map<any, HTMLElement>();
    let blockIndex = 0;
    
    editor.state.doc.descendants((node: any) => {
      if (node.type.name === 'blockContainer' && blockIndex < allBlockElements.length) {
        blockMap.set(node, allBlockElements[blockIndex] as HTMLElement);
        blockIndex++;
      }
    });
    
    const htmlSlides = slides.map((slideBlocks) => {
      const slideDiv = document.createElement('div');
      slideDiv.className = 'bn-slide-content';
      
      slideBlocks.forEach((block: any) => {
        let found = false;
        for (const [docNode, domElement] of blockMap.entries()) {
          if (docNode.firstChild?.type.name === block.type) {
            const docText = extractText(extractInlineContent(docNode.firstChild.content));
            const blockText = extractText(block.content);
            if (docText === blockText || (docText.includes(blockText) && blockText.length > 5)) {
              const clone = domElement.cloneNode(true) as HTMLElement;
              clone.removeAttribute('contenteditable');
              clone.querySelectorAll('[contenteditable]').forEach(el => el.removeAttribute('contenteditable'));
              clone.querySelectorAll('.bn-block-handle, .bn-add-block-button').forEach(el => el.remove());
              slideDiv.appendChild(clone);
              blockMap.delete(docNode);
              found = true;
              break;
            }
          }
        }
        if (!found) {
          const html = renderBlock(block);
          if (html) {
            const temp = document.createElement('div');
            temp.innerHTML = html;
            if (temp.firstChild) slideDiv.appendChild(temp.firstChild);
          }
        }
      });
      return slideDiv.innerHTML || '<p>Empty slide</p>';
    });
    
    setAllSlides(htmlSlides);
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
            slides={allSlides.length > 0 ? allSlides : splitIntoSlides().map(s => renderSlide(s))}
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
