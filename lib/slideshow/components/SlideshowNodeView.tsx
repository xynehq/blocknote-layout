import { ReactNodeViewRenderer, NodeViewProps, NodeViewWrapper } from '@tiptap/react';
import { Node } from '@tiptap/core';
import React, { useState, useEffect } from 'react';
import { PresentationModal } from './PresentationModal';
import '../styles/slideshow.css';

const SlideshowNodeView: React.FC<NodeViewProps> = ({ node, editor }) => {
  const [showPresentation, setShowPresentation] = useState(false);
  const [slideCount, setSlideCount] = useState(0);
  const [allSlides, setAllSlides] = useState<string[]>([]);
  const [selectedTheme, setSelectedTheme] = useState(node.attrs.theme || 'white');

  const updatePreview = () => {
    
    const slides = splitIntoSlides();
    setSlideCount(slides.length);
    
    // Get the editor's DOM container
    const editorContainer = editor.view.dom;
    const htmlSlides: string[] = [];
    
    // Get all block containers from the editor DOM
    // BlockNote uses .bn-block-outer wrapper divs
    const allBlockElements = Array.from(editorContainer.querySelectorAll('.bn-block-outer'));
    
    // Build a map of blocks by traversing the document in the same order
    const blockMap = new Map<any, HTMLElement>();
    let blockIndex = 0;
    
    editor.state.doc.descendants((node: any) => {
      if (node.type.name === 'blockContainer' && blockIndex < allBlockElements.length) {
        const domElement = allBlockElements[blockIndex] as HTMLElement;
        if (domElement) {
          blockMap.set(node, domElement);
        }
        blockIndex++;
      }
    });
    
    
    // For each slide, try to clone the actual DOM elements
    slides.forEach((slideBlocks, slideIndex) => {
      const slideDiv = document.createElement('div');
      slideDiv.className = 'bn-slide-content';
      
      let clonedCount = 0;
      let fallbackCount = 0;
      
      slideBlocks.forEach((block: any) => {
        let foundDomElement = false;
        
        // Try to find the DOM element for this block by matching content
        for (const [docNode, domElement] of blockMap.entries()) {
          if (docNode.firstChild && docNode.firstChild.type.name === block.type) {
            // Simple content matching - check if text content matches
            const docText = extractText(extractInlineContent(docNode.firstChild.content));
            const blockText = extractText(block.content);
            
            if (docText === blockText || (docText.includes(blockText) && blockText.length > 5)) {
              // Clone the DOM element
              const clonedBlock = domElement.cloneNode(true) as HTMLElement;
              
              // Clean up interactive elements and contenteditable
              clonedBlock.removeAttribute('contenteditable');
              clonedBlock.querySelectorAll('[contenteditable]').forEach(el => {
                el.removeAttribute('contenteditable');
              });
              
              // Remove block handles and other UI elements
              clonedBlock.querySelectorAll('.bn-block-handle, .bn-add-block-button').forEach(el => {
                el.remove();
              });
              
              slideDiv.appendChild(clonedBlock);
              foundDomElement = true;
              clonedCount++;
              
              // Remove from map so we don't match it again
              blockMap.delete(docNode);
              break;
            }
          }
        }
        
        // Fallback: render using our custom function if no DOM match found
        if (!foundDomElement) {
          const html = renderBlock(block);
          if (html) {
            const tempDiv = document.createElement('div');
            tempDiv.innerHTML = html;
            if (tempDiv.firstChild) {
              slideDiv.appendChild(tempDiv.firstChild);
            } else {
              slideDiv.innerHTML += html;
            }
            fallbackCount++;
          }
        }
      });
      
      if (slideIndex === 0) {
      }
      
      htmlSlides.push(slideDiv.innerHTML || '<p>Empty slide</p>');
    });
    
    if (htmlSlides[0]) {
    }
    setAllSlides(htmlSlides);
    
  };

  useEffect(() => {
    updatePreview();
  }, [node.attrs.canvasId]);

  // Sync dropdown state with node attributes when they change
  useEffect(() => {
    if (node.attrs.theme && node.attrs.theme !== selectedTheme) {
      setSelectedTheme(node.attrs.theme);
    }
  }, [node.attrs.theme]);

  const handleGenerateSlides = () => {
    updatePreview();
    setShowPresentation(true);
  };

  const handleClosePresentation = () => {
    setShowPresentation(false);
  };

  const getBlockWeight = (block: any): number => {
    if (block.type === 'heading') {
      const level = block.props?.level || 1;
      return level === 1 ? 1.5 : 1.2;
    }
    if (block.type === 'paragraph') {
      const textLength = extractText(block.content).length;
      return textLength > 100 ? 2 : 1;
    }
    if (block.type === 'bulletListItem' || block.type === 'numberedListItem') {
      return 0.5;
    }
    if (block.type === 'codeBlock') return 3;
    if (block.type === 'table') return 2.5;
    if (block.type === 'image') return 2;
    return 1;
  };

  const splitByWeight = (blocks: any[]): any[][] => {
    const MAX_WEIGHT_PER_SLIDE = 20;
    const slides: any[][] = [];
    let currentSlide: any[] = [];
    let currentWeight = 0;

    blocks.forEach((block: any) => {
      const blockWeight = getBlockWeight(block);
      if (currentWeight + blockWeight > MAX_WEIGHT_PER_SLIDE && currentSlide.length > 0) {
        slides.push([...currentSlide]);
        currentSlide = [block];
        currentWeight = blockWeight;
      } else {
        currentSlide.push(block);
        currentWeight += blockWeight;
      }
    });
    
    if (currentSlide.length > 0) slides.push(currentSlide);
    return slides;
  };

  const splitIntoSlides = () => {
    const docContent: any[] = [];
    editor.state.doc.descendants((node: any) => {
      if (node.type.name === 'blockContainer') {
        if (node.firstChild) {
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
      }
    });
    
    const allBlocks = docContent.filter((b: any) => b.type !== 'slideshow');

    // Step 1: Check if there are any ---, ***, or — markers
    const hasHR = allBlocks.some((block: any) => 
      block.type === 'paragraph' && block.content.length === 1 && 
      (block.content[0]?.text?.trim() === '---' || 
       block.content[0]?.text?.trim() === '—' ||
       block.content[0]?.text?.trim() === '***')
    );

    if (hasHR) {
      // Split by --- markers into sections
      const hrSections: any[][] = [];
      let currentHRSection: any[] = [];

      allBlocks.forEach((block: any) => {
        const isHR = block.type === 'paragraph' && block.content.length === 1 && 
                     (block.content[0]?.text?.trim() === '---' || 
                      block.content[0]?.text?.trim() === '—' ||
                      block.content[0]?.text?.trim() === '***');
        if (isHR) {
          if (currentHRSection.length > 0) {
            hrSections.push([...currentHRSection]);
            currentHRSection = [];
          }
        } else {
          currentHRSection.push(block);
        }
      });
      
      if (currentHRSection.length > 0) hrSections.push(currentHRSection);
      
      // Now apply heading/weight splitting to each --- section
      const finalSlides: any[][] = [];
      hrSections.forEach((section) => {
        const sectionSlides = splitByHeadings(section);
        finalSlides.push(...sectionSlides);
      });
      
      return finalSlides.length > 0 ? finalSlides : [[{ type: 'paragraph', content: [{ type: 'text', text: 'Empty Canvas' }] }]];
    }

    // Step 2: No --- found, split by headings then weight
    return splitByHeadings(allBlocks);
  };

  const splitByHeadings = (blocks: any[]): any[][] => {
    const MAX_WEIGHT_PER_SLIDE = 20;
    const hasH1OrH2 = blocks.some((block: any) => 
      block.type === 'heading' && (block.props?.level === 1 || block.props?.level === 2)
    );

    if (!hasH1OrH2) {
      return splitByWeight(blocks);
    }

    const sections: any[][] = [];
    let currentSection: any[] = [];
    let seenFirstHeading = false;

    blocks.forEach((block: any) => {
      const isH1orH2 = block.type === 'heading' && (block.props?.level === 1 || block.props?.level === 2);
      
      if (isH1orH2) {
        if (seenFirstHeading && currentSection.length > 0) {
          sections.push([...currentSection]);
          currentSection = [block];
        } else {
          currentSection.push(block);
          seenFirstHeading = true;
        }
      } else {
        currentSection.push(block);
      }
    });
    
    if (currentSection.length > 0) sections.push(currentSection);

    // Split each section by weight if needed, but be more lenient with first section
    const finalSlides: any[][] = [];
    sections.forEach((section, sectionIndex) => {
      const sectionWeight = section.reduce((sum, block) => sum + getBlockWeight(block), 0);
      const weightThreshold = sectionIndex === 0 ? MAX_WEIGHT_PER_SLIDE * 1.5 : MAX_WEIGHT_PER_SLIDE;
      
      if (sectionWeight > weightThreshold) {
        finalSlides.push(...splitByWeight(section));
      } else {
        finalSlides.push(section);
      }
    });

    return finalSlides;
  };

  const extractText = (content: any[]): string => {
    if (!content) return '';
    return content.map((item: any) => {
      if (typeof item === 'string') return item;
      if (item.type === 'text') return item.text || '';
      if (item.type === 'link') return extractText(item.content || []);
      return '';
    }).join('');
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
        if (item.styles?.textColor) text = `<span style="color: ${item.styles.textColor}">${text}</span>`;
        if (item.styles?.backgroundColor) text = `<span style="background-color: ${item.styles.backgroundColor}">${text}</span>`;
        return text;
      }
      if (item.type === 'link') {
        const linkText = renderInlineContent(item.content || []);
        return `<a href="${item.href}" target="_blank" rel="noopener noreferrer">${linkText}</a>`;
      }
      return '';
    }).join('');
  };

  const extractInlineContent = (content: any): any[] => {
    if (!content) return [];
    
    // Handle ProseMirror Fragment
    const nodes: any[] = [];
    if (content.content) {
      // It's a Fragment or Node with content
      if (Array.isArray(content.content)) {
        content.content.forEach((node: any) => nodes.push(node));
      } else {
        // It's a Fragment object, iterate it
        content.content.forEach((node: any) => nodes.push(node));
      }
    } else {
      return [];
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
            if (mark.type.name === 'textStyle') {
              if (mark.attrs.color) styles.textColor = mark.attrs.color;
            }
            if (mark.type.name === 'backgroundColor') {
              styles.backgroundColor = mark.attrs.backgroundColor;
            }
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
        cells.push({
          content: extractInlineContent(cell.content.firstChild)
        });
      });
      rows.push({ cells });
    });
    return { type: 'table', rows };
  };

  const renderBlock = (block: any): string => {
    if (block.type === 'heading') {
      const level = block.props?.level || 1;
      const content = renderInlineContent(block.content);
      return `<h${level} class="bn-heading">${content}</h${level}>`;
    }
    
    if (block.type === 'paragraph') {
      const content = renderInlineContent(block.content);
      return `<p class="bn-paragraph">${content}</p>`;
    }
    
    if (block.type === 'bulletListItem') {
      const content = renderInlineContent(block.content);
      return `<li class="bn-list-item">${content}</li>`;
    }
    
    if (block.type === 'numberedListItem') {
      const content = renderInlineContent(block.content);
      return `<li class="bn-list-item bn-numbered">${content}</li>`;
    }
    
    if (block.type === 'codeBlock') {
      const code = extractText(block.content);
      const language = block.props?.language || '';
      return `<pre class="bn-code-block"><code class="language-${language}">${code}</code></pre>`;
    }
    
    if (block.type === 'table') {
      let tableHTML = '<table class="bn-table"><tbody>';
      block.rows.forEach((row: any) => {
        tableHTML += '<tr>';
        row.cells.forEach((cell: any) => {
          const cellContent = renderInlineContent(cell.content);
          tableHTML += `<td>${cellContent}</td>`;
        });
        tableHTML += '</tr>';
      });
      tableHTML += '</tbody></table>';
      return tableHTML;
    }
    
    if (block.type === 'quote') {
      const content = renderInlineContent(block.content);
      return `<blockquote class="bn-quote">${content}</blockquote>`;
    }
    
    if (block.type === 'image') {
      const src = block.props?.url || '';
      const alt = block.props?.caption || '';
      return `<img src="${src}" alt="${alt}" class="bn-image" />`;
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
          listType = '';
        }
        html += renderBlock(block);
      }
    });

    if (inList) {
      html += listType === 'ol' ? '</ol>' : '</ul>';
    }

    return html;
  };

  const generateSlidesHTML = (): string[] => {
    const slides = splitIntoSlides();
    return slides.map(slide => renderSlide(slide));
  };


  return (
    <NodeViewWrapper>
      <div className="bn-slideshow-node" contentEditable={false}>
        <div className="bn-slideshow-header">
          <div className="bn-slideshow-title">
            Slideshow
            {slideCount > 0 && (
              <span className="bn-slide-count">({slideCount} slides)</span>
            )}
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
            <button 
              onClick={handleGenerateSlides}
              className="bn-slideshow-btn"
            >
              ▶ Present
            </button>
          </div>
        </div>
        {showPresentation && (
          <PresentationModal
            theme={selectedTheme} 
            slides={allSlides.length > 0 ? allSlides : generateSlidesHTML()}
            onClose={handleClosePresentation}
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
      canvasId: {
        default: null,
      },
      theme: {
        default: 'white',
      },
    };
  },

  parseHTML() {
    return [
      {
        tag: 'div[data-type="slideshow"]',
      },
    ];
  },

  renderHTML({ HTMLAttributes }) {
    return ['div', { 'data-type': 'slideshow', ...HTMLAttributes }, 0];
  },

  addNodeView() {
    return ReactNodeViewRenderer(SlideshowNodeView);
  },
});

export default SlideshowNodeView;
