import type { BlockNoteEditor } from '@blocknote/core';

// Maximum blocks per slide before forcing a split (safety net)
const MAX_BLOCKS_PER_SLIDE = 15;

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

// Check if a block is empty (has no meaningful content)
const isEmptyBlock = (block: any): boolean => {
  // Check if it's a paragraph with no content or only whitespace
  if (block.type === 'paragraph') {
    const text = extractText(block.content).trim();
    return text === '';
  }
  // Empty list items
  if (block.type === 'bulletListItem' || block.type === 'numberedListItem') {
    const text = extractText(block.content).trim();
    return text === '';
  }
  return false;
};

// Check if a slide (array of blocks) contains only empty blocks
const isEmptySlide = (blocks: any[]): boolean => {
  if (blocks.length === 0) return true;
  return blocks.every(block => isEmptyBlock(block));
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

  if (!hasH1 && !hasH2) return [blocks];

  const nested = hasNestedStructure(blocks);
  const sections: any[][] = [];
  let current: any[] = [];
  let firstH2UnderCurrentH1 = true;

  for (let i = 0; i < blocks.length; i++) {
    const block = blocks[i];
    const level = getHeadingLevel(block);

    if (nested) {
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

const extractInlineContent = (content: any): any[] => {
  if (!content) return [];
  const nodes: any[] = [];
  if (content.content) {
    content.content.forEach((node: any) => nodes.push(node));
  }
  return nodes.map((node: any) => {
    if (node.type?.name === 'text') {
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

/**
 * Generate slides HTML from BlockNote editor by cloning actual DOM elements.
 * This preserves all custom blocks like mermaid diagrams, columns, etc.
 * 
 * @param editor - The BlockNote editor instance (must have access to editor._tiptapEditor)
 * @returns Array of HTML strings, one per slide
 */
export const generateSlidesFromBlocks = (editor: BlockNoteEditor<any, any, any>): string[] => {
  const tiptapEditor = (editor as any)._tiptapEditor;
  if (!tiptapEditor) {
    console.error('Could not access tiptap editor');
    return ['<p>Error: Could not access editor</p>'];
  }

  // Extract block data from the document for splitting logic
  const docContent: any[] = [];
  const nodeToBlockMap = new Map<any, any>();

  tiptapEditor.state.doc.descendants((node: any) => {
    if (node.type.name === 'blockContainer' && node.firstChild) {
      const blockNode = node.firstChild;
      const attrs = { ...blockNode.attrs };
      const blockData: any = {
        type: blockNode.type.name,
        props: attrs,
        content: extractInlineContent(blockNode.content),
        _node: node, // Keep reference to the ProseMirror node
      };
      docContent.push(blockData);
      nodeToBlockMap.set(blockData, node);
    }
  });

  // Filter out slideshow blocks
  let allBlocks = docContent.filter((b: any) => b.type !== 'slideshow');

  // Skip leading empty blocks to prevent blank first slide
  let firstNonEmptyIndex = 0;
  while (firstNonEmptyIndex < allBlocks.length && isEmptyBlock(allBlocks[firstNonEmptyIndex])) {
    firstNonEmptyIndex++;
  }
  allBlocks = allBlocks.slice(firstNonEmptyIndex);

  if (allBlocks.length === 0) {
    return ['<p>Empty Canvas</p>'];
  }

  // Apply splitting logic
  const markerSections = splitByMarkers(allBlocks);
  const finalSlides: any[][] = [];

  for (const section of markerSections) {
    if (section.length === 0 || isEmptySlide(section)) continue;

    if (section.length > MAX_BLOCKS_PER_SLIDE) {
      const headingSections = splitByHeadings(section);
      for (const headingSection of headingSections) {
        if (isEmptySlide(headingSection)) continue; // Skip empty slides

        if (headingSection.length > MAX_BLOCKS_PER_SLIDE) {
          const blockSections = splitLongSection(headingSection);
          // Filter out any empty slides from block sections
          finalSlides.push(...blockSections.filter(slide => !isEmptySlide(slide)));
        } else {
          finalSlides.push(headingSection);
        }
      }
    } else {
      finalSlides.push(section);
    }
  }

  if (finalSlides.length === 0) {
    return ['<p>Empty Canvas</p>'];
  }

  // Get all DOM block elements from the editor
  const editorContainer = tiptapEditor.view.dom;
  const allBlockElements = Array.from(editorContainer.querySelectorAll('.bn-block-outer')) as HTMLElement[];

  // Map ProseMirror nodes to DOM elements
  const blockDomMap = new Map<any, HTMLElement>();
  let blockIndex = 0;

  tiptapEditor.state.doc.descendants((node: any) => {
    if (node.type.name === 'blockContainer' && blockIndex < allBlockElements.length) {
      blockDomMap.set(node, allBlockElements[blockIndex]);
      blockIndex++;
    }
  });

  // Build slides by cloning DOM elements
  const htmlSlides = finalSlides.map((slideBlocks) => {
    const slideDiv = document.createElement('div');
    slideDiv.className = 'bn-slide-content';

    for (const block of slideBlocks) {
      const pmNode = nodeToBlockMap.get(block);
      const domElement = pmNode ? blockDomMap.get(pmNode) : null;

      if (domElement) {
        // Clone the actual DOM element (preserves mermaid, columns, etc.)
        const clone = domElement.cloneNode(true) as HTMLElement;

        // Clean up editor-specific attributes and elements
        clone.removeAttribute('contenteditable');
        clone.querySelectorAll('[contenteditable]').forEach(el => el.removeAttribute('contenteditable'));
        clone.querySelectorAll('.bn-block-handle, .bn-add-block-button, .bn-drag-handle').forEach(el => el.remove());

        slideDiv.appendChild(clone);
      }
    }

    return slideDiv.innerHTML || '<p>Empty slide</p>';
  });

  return htmlSlides;
};
