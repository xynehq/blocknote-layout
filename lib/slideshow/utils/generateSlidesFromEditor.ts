import type { BlockNoteEditor } from '@blocknote/core';

// Slide content types - supports both HTML and React component data
export interface HtmlSlide {
  type: 'html';
  content: string;
}

export interface WhiteboardSlide {
  type: 'whiteboard';
  title: string;
  data: {
    elements: any[];
    appState: any;
    files: any;
  };
}

export type SlideContent = HtmlSlide | WhiteboardSlide;

// Parse whiteboard data from string or object
const parseWhiteboardData = (data: string | object | null): { elements: any[]; appState: any; files: any } | null => {
  if (!data) return null;

  try {
    const parsed = typeof data === 'string' ? JSON.parse(data) : data;

    if (parsed && (parsed.elements || parsed.appState)) {
      return {
        elements: parsed.elements || [],
        appState: parsed.appState || {},
        files: parsed.files || null,
      };
    }
  } catch (error) {
    console.warn('Failed to parse whiteboard data:', error);
  }

  return null;
};

// Maximum visual weight per slide (replaces simple block count)
// Set to 25 to balance content density and prevent overflow
const MAX_WEIGHT_PER_SLIDE = 25;

// Estimate the visual "weight" of a block based on content and nesting
const estimateBlockWeight = (block: any): number => {
  if (!block._domElement) return 1;

  // Count nested blocks (for lists with many children)
  const nestedBlocks = block._domElement.querySelectorAll('.bn-block-outer');
  const nestedCount = nestedBlocks.length;

  // Get text content length
  const textContent = block._domElement.textContent || '';
  const textLength = textContent.trim().length;

  // Calculate weight components
  const baseWeight = 1;
  const textWeight = textLength / 200; // ~200 characters = 1 weight unit
  const nestingWeight = nestedCount * 0.3; // Each nested block = 0.3 weight units

  // Headings don't count toward weight - they trigger their own splits in Step 3
  if (block.type === 'heading') {
    return 0;
  }

  // Block type multipliers
  let typeMultiplier = 1;
  const mediaTypes = ['image', 'video'];

  if (mediaTypes.includes(block.type)) {
    return 8; // Media takes significant visual space
  }

  if (block.type === 'code' || block.type === 'table') {
    typeMultiplier = 1.5; // Code and tables take more space
  }

  const totalWeight = (baseWeight + textWeight + nestingWeight) * typeMultiplier;

  return Math.max(1, totalWeight); // Minimum weight of 1
};

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
  // Whiteboard blocks are never empty if they have data
  if (block.type === 'whiteboard') {
    return !block.props?.whiteboardData;
  }

  if (block.type === 'mermaid') {
    return false;
  }

  // Media blocks are never empty
  const mediaTypes = ['image', 'video'];
  if (mediaTypes.includes(block.type)) {
    return false;
  }

  // Check text content from DOM for regular blocks
  const text = block._domElement?.textContent?.trim() || '';
  return text === '' && !block._domElement?.querySelector('img, video, .bn-image, .bn-video, [data-content-type="image"], [data-content-type="video"]');
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
    const text = block._domElement?.textContent?.trim() || '';
    return text === '---' || text === '***' || text === '—' || text === '___' || text === '- - -';
  }
  return false;
};

// Check if a block is a custom block type that should get its own slide
const isCustomBlock = (block: any): boolean => {
  const customBlockTypes = ['whiteboard', 'mermaid'];
  return customBlockTypes.includes(block.type);
};

// Get heading level (0 if not a heading)
const getHeadingLevel = (block: any): number => {
  if (block.type !== 'heading') return 0;
  return block.props?.level || 1;
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

// STEP 2: Split by custom blocks (each custom block gets its own slide)
const splitByCustomBlocks = (blocks: any[]): any[][] => {
  const sections: any[][] = [];
  let current: any[] = [];

  for (const block of blocks) {
    if (isCustomBlock(block)) {
      // Push any accumulated regular blocks
      if (current.length > 0) {
        sections.push(current);
        current = [];
      }
      // Custom block gets its own slide
      sections.push([block]);
    } else {
      current.push(block);
    }
  }

  if (current.length > 0) sections.push(current);
  return sections.length > 0 ? sections : [blocks];
};

// STEP 3: Split by headings (H1 and H2 only - H3 is treated as subheading)
const splitByHeadings = (blocks: any[]): any[][] => {
  const hasH1 = blocks.some(b => getHeadingLevel(b) === 1);
  const hasH2 = blocks.some(b => getHeadingLevel(b) === 2);

  if (!hasH1 && !hasH2) return [blocks]; // No H1/H2 headings, keep as one

  const sections: any[][] = [];
  let current: any[] = [];

  // Determine split level: H1 if present, otherwise H2
  const splitLevel = hasH1 ? 1 : 2;

  for (let i = 0; i < blocks.length; i++) {
    const block = blocks[i];
    const level = getHeadingLevel(block);

    // Split on H1 or H2 (depending on splitLevel), but NOT on H3
    if (level === splitLevel && i > 0) {
      // MEDIA AWARE SPLIT: If the current slide only has media blocks, 
      // let the heading join them instead of splitting. 
      // This enables [Image] -> [Heading] -> [Text] to be on one split slide.
      const isMedia = (b: any) => ['image', 'video'].includes(b.type) ||
        b._domElement?.querySelector('img, video, .bn-image, .bn-video, .bn-visual-attachment');

      const onlyMediaSoFar = current.length > 0 && current.every(isMedia);

      if (onlyMediaSoFar) {
        current.push(block);
        continue;
      }

      // Only split if current section has text content (not just headings/media)
      const hasTextContent = current.some(b => getHeadingLevel(b) === 0 && !isMedia(b));

      if (hasTextContent && current.length > 0) {
        sections.push(current);
        current = [block];
      } else {
        // No text content yet, keep accumulating
        current.push(block);
      }
    } else {
      current.push(block);
    }
  }

  if (current.length > 0) sections.push(current);
  return sections.length > 0 ? sections : [blocks];
};

// STEP 4: Smart split for long sections using visual weight instead of block count
const splitLongSection = (blocks: any[]): any[][] => {
  // Calculate total weight of all blocks
  const totalWeight = blocks.reduce((sum, block) => sum + estimateBlockWeight(block), 0);

  // If total weight fits in one slide, no need to split
  if (totalWeight <= MAX_WEIGHT_PER_SLIDE) {
    return [blocks];
  }

  const slides: any[][] = [];
  let currentSlide: any[] = [];
  let currentWeight = 0;

  for (let i = 0; i < blocks.length; i++) {
    const block = blocks[i];
    const blockWeight = estimateBlockWeight(block);

    // Would adding this block exceed the threshold?
    if (currentWeight + blockWeight > MAX_WEIGHT_PER_SLIDE) {
      // Improved bidirectional sticky logic: 
      // Media wants to be with text, and text wants to be with media to enable the split layout.

      const isMedia = block.type === 'image' || block.type === 'video' ||
        block._domElement?.querySelector('img, video, .bn-image, .bn-video, .bn-visual-attachment, .bn-video-embed');

      const hasTextInCurrent = currentSlide.some(b => !['image', 'video', 'whiteboard'].includes(b.type));
      const hasOnlyMediaInCurrent = currentSlide.length > 0 && currentSlide.every(b => {
        return ['image', 'video'].includes(b.type) ||
          b._domElement?.querySelector('img, video, .bn-image, .bn-video, .bn-visual-attachment');
      });

      // Scenario 1: Media follows text -> pull media into current slide
      if (isMedia && hasTextInCurrent && currentWeight + blockWeight < MAX_WEIGHT_PER_SLIDE * 1.8) {
        currentSlide.push(block);
        currentWeight += blockWeight;
        continue;
      }

      // Scenario 2: Text follows media -> pull text into current slide containing only media
      if (!isMedia && hasOnlyMediaInCurrent && block.type !== 'whiteboard' && currentWeight + blockWeight < MAX_WEIGHT_PER_SLIDE * 1.8) {
        currentSlide.push(block);
        currentWeight += blockWeight;
        continue;
      }

      // Check if this block can fit on its own slide
      if (blockWeight <= MAX_WEIGHT_PER_SLIDE) {
        // YES - Move entire block to next slide (don't cut it)
        if (currentSlide.length > 0) {
          slides.push(currentSlide);
        }
        currentSlide = [block];
        currentWeight = blockWeight;
      } else {
        // NO - Block is too large even for its own slide
        // Put it on its own slide anyway (unavoidable overflow)
        if (currentSlide.length > 0) {
          slides.push(currentSlide);
        }
        slides.push([block]);
        currentSlide = [];
        currentWeight = 0;
      }
    } else {
      // Block fits, add it to current slide
      currentSlide.push(block);
      currentWeight += blockWeight;

      // Optional: Try to break at H3 boundaries when we're getting close to limit
      const nextBlock = blocks[i + 1];
      if (nextBlock) {
        const nextWeight = estimateBlockWeight(nextBlock);
        const nextLevel = getHeadingLevel(nextBlock);

        // If next block is H3 and adding it would exceed, break here
        if (nextLevel === 3 && currentWeight + nextWeight > MAX_WEIGHT_PER_SLIDE) {
          slides.push(currentSlide);
          currentSlide = [];
          currentWeight = 0;
        }
      }
    }
  }

  // Add remaining blocks
  if (currentSlide.length > 0) {
    slides.push(currentSlide);
  }

  return slides.length > 0 ? slides : [blocks];
};

/**
 * Generate slides HTML from BlockNote editor using pure DOM traversal.
 * This preserves all custom blocks and nested structures.
 * Returns a Promise that resolves to an array of SlideContent (HTML or Whiteboard).
 */
export const generateSlidesFromBlocks = async (editor: BlockNoteEditor<any, any, any>): Promise<SlideContent[]> => {
  const tiptapEditor = (editor as any)._tiptapEditor;
  if (!tiptapEditor) {
    console.error('Could not access tiptap editor');
    return [{ type: 'html', content: '<p>Error: Could not access editor</p>' }];
  }

  // Get the ProseMirror document for accessing node attributes (needed for whiteboard data)
  const pmDoc = tiptapEditor.state.doc;

  // Use pure DOM - no ProseMirror mapping needed!
  const editorContainer = tiptapEditor.view.dom;
  const allBlockElements = Array.from(editorContainer.querySelectorAll('.bn-block-outer')) as HTMLElement[];

  // Filter to only top-level blocks (not nested in another block-group)
  const topLevelBlockElements = allBlockElements.filter((blockEl) => {
    let parent = blockEl.parentElement;
    let blockGroupCount = 0;

    while (parent && parent !== editorContainer) {
      if (parent.classList.contains('bn-block-group')) {
        blockGroupCount++;
      }
      parent = parent.parentElement;
    }

    return blockGroupCount === 1;
  });

  // Collect all whiteboard nodes from ProseMirror document first
  // This ensures we can match them in order with DOM elements
  const whiteboardNodes: Array<{ data: string | object | null; title: string }> = [];
  pmDoc.descendants((node: any) => {
    if (node.type.name === 'whiteboard') {
      whiteboardNodes.push({
        data: node.attrs.data,
        title: node.attrs.title || 'Whiteboard',
      });
    }
    return true;
  });
  let whiteboardIndex = 0;

  // Extract block data directly from DOM
  const docContent: any[] = [];

  topLevelBlockElements.forEach((domElement) => {
    // Get block type from data attribute or element structure
    // Check both child elements and the element itself (for custom blocks like whiteboard)
    let blockContent = domElement.querySelector('[data-content-type]');
    let type = blockContent?.getAttribute('data-content-type') || 'paragraph';

    // Special handling for collapsed custom blocks - check wrapper classes
    // This handles cases where the content-type is on a wrapper that might not be the direct child
    if (!blockContent || type === 'paragraph') {
      // Check for whiteboard wrapper (handles collapsed state)
      const whiteboardWrapper = domElement.querySelector('.whiteboard-wrapper, .blocknote-whiteboard');
      if (whiteboardWrapper) {
        type = 'whiteboard';
        blockContent = whiteboardWrapper;
      }

      // Check for mermaid wrapper
      const mermaidWrapper = domElement.querySelector('.mermaid-wrapper, .blocknote-mermaid');
      if (mermaidWrapper) {
        type = 'mermaid';
        blockContent = mermaidWrapper;
      }

      // Final fallback for images/videos that might not have the data attribute on first child
      if (type === 'paragraph') {
        const inner = domElement.querySelector('[data-content-type]');
        if (inner) {
          type = inner.getAttribute('data-content-type') || 'paragraph';
        }
      }

      // Broad detection for media based on elements and common classes
      if (type === 'paragraph' || type === 'image' || type === 'video') {
        if (domElement.querySelector('img, .bn-image, [data-content-type="image"], .bn-visual-attachment')) type = 'image';
        else if (domElement.querySelector('video, .bn-video, .bn-video-embed, [data-content-type="video"]')) type = 'video';
      }
    }

    // Extract additional props based on block type
    const props: any = {};

    if (type === 'heading') {
      // Try to get heading level from data attribute
      const levelAttr = blockContent?.getAttribute('data-level');
      if (levelAttr) {
        props.level = parseInt(levelAttr, 10);
      } else {
        // Fallback: check for h1, h2, h3 elements inside
        const h1 = domElement.querySelector('h1');
        const h2 = domElement.querySelector('h2');
        const h3 = domElement.querySelector('h3');
        if (h1) props.level = 1;
        else if (h2) props.level = 2;
        else if (h3) props.level = 3;
        else props.level = 1; // Default to H1
      }
    }

    // For whiteboard blocks, extract the data from the pre-collected nodes
    if (type === 'whiteboard') {
      // Get the corresponding whiteboard node data (in order)
      if (whiteboardIndex < whiteboardNodes.length) {
        const whiteboardNode = whiteboardNodes[whiteboardIndex];
        const parsed = parseWhiteboardData(whiteboardNode.data);
        if (parsed) {
          props.whiteboardData = parsed;
          props.whiteboardTitle = whiteboardNode.title;
        }
        whiteboardIndex++;
      }
    }

    const blockData: any = {
      type: type,
      props: props,
      _domElement: domElement, // Store DOM reference directly
    };

    docContent.push(blockData);
  });

  // Filter out slideshow, audio, and file blocks
  let allBlocks = docContent.filter((b: any) => !['slideshow', 'audio', 'file'].includes(b.type));

  // Skip leading empty blocks to prevent blank first slide
  let firstNonEmptyIndex = 0;
  while (firstNonEmptyIndex < allBlocks.length && isEmptyBlock(allBlocks[firstNonEmptyIndex])) {
    firstNonEmptyIndex++;
  }
  allBlocks = allBlocks.slice(firstNonEmptyIndex);

  if (allBlocks.length === 0) {
    return [{ type: 'html', content: '<p>Empty Canvas</p>' }];
  }

  // Apply splitting logic
  const markerSections = splitByMarkers(allBlocks);
  const finalSlides: any[][] = [];

  for (const section of markerSections) {
    if (section.length === 0 || isEmptySlide(section)) continue;

    // Split by custom blocks (each custom block gets its own slide)
    const customBlockSections = splitByCustomBlocks(section);

    for (const customSection of customBlockSections) {
      if (isEmptySlide(customSection)) continue;

      // Split by headings (primary strategy for regular content)
      const headingSections = splitByHeadings(customSection);

      // For each heading section, split by weight if needed
      for (const headingSection of headingSections) {
        if (isEmptySlide(headingSection)) continue;

        // splitLongSection now handles weight-based splitting internally
        const blockSections = splitLongSection(headingSection);
        finalSlides.push(...blockSections.filter(slide => !isEmptySlide(slide)));
      }
    }
  }

  if (finalSlides.length === 0) {
    return [{ type: 'html', content: '<p>Empty Canvas</p>' }];
  }

  // Build slides - return SlideContent[] (HTML or Whiteboard)
  const slides: SlideContent[] = finalSlides.map((slideBlocks) => {
    // Check if this is a whiteboard-only slide
    if (slideBlocks.length === 1 && slideBlocks[0].type === 'whiteboard' && slideBlocks[0].props?.whiteboardData) {
      const block = slideBlocks[0];
      return {
        type: 'whiteboard' as const,
        title: block.props.whiteboardTitle || 'Whiteboard',
        data: block.props.whiteboardData,
      };
    }

    // Identify which blocks are media (attachments)
    const mediaTypes = ['image', 'video'];
    const mediaBlocks = slideBlocks.filter(b => {
      // Primary check: Block type
      if (mediaTypes.includes(b.type)) return true;

      // Secondary check: DOM structure (catches images/videos missed by type check)
      const dom = b._domElement;
      if (!dom) return false;

      return dom.querySelector('img, video, .bn-image, .bn-video, .bn-visual-attachment, .bn-video-embed, [data-content-type="image"], [data-content-type="video"]');
    });

    const textBlocks = slideBlocks.filter(b => {
      // If it's identified as media, it's not text
      if (mediaBlocks.includes(b)) return false;
      if (b.type === 'whiteboard') return false;

      // Check for content or specific block types that count as "text"
      const text = b._domElement?.textContent?.trim() || '';
      return text.length > 0 || ['heading', 'table', 'code', 'mermaid'].includes(b.type);
    });

    // Build HTML slide
    const slideDiv = document.createElement('div');
    slideDiv.className = 'bn-slide-content';

    // TRIGGER SPLIT LAYOUT: If we have both media and text on this slide, put them side-by-side
    if (mediaBlocks.length > 0 && textBlocks.length > 0) {
      slideDiv.classList.add('bn-slide-layout-split');

      const leftCol = document.createElement('div');
      leftCol.className = 'bn-slide-layout-left';

      const rightCol = document.createElement('div');
      rightCol.className = 'bn-slide-layout-right bn-media-container';

      // Process text blocks for the left column
      for (const block of textBlocks) {
        const domElement = block._domElement;
        if (domElement) {
          const clone = domElement.cloneNode(true) as HTMLElement;
          cleanupClone(clone);
          leftCol.appendChild(clone);
        }
      }

      // Process media blocks for the right column
      for (const block of mediaBlocks) {
        const domElement = block._domElement;
        if (domElement) {
          const clone = domElement.cloneNode(true) as HTMLElement;
          cleanupClone(clone);
          rightCol.appendChild(clone);
        }
      }

      slideDiv.appendChild(leftCol);
      slideDiv.appendChild(rightCol);
    } else {
      // Default vertical layout
      for (const block of slideBlocks) {
        // Skip whiteboards in mixed slides (they get their own slide above)
        if (block.type === 'whiteboard') continue;

        const domElement = block._domElement;

        if (domElement) {
          // Clone the actual DOM element (preserves nested lists, mermaid, etc.)
          const clone = domElement.cloneNode(true) as HTMLElement;
          cleanupClone(clone);
          slideDiv.appendChild(clone);
        }
      }
    }

    return {
      type: 'html' as const,
      content: slideDiv.outerHTML || '<p>Empty slide</p>',
    };

  });

  function cleanupClone(clone: HTMLElement) {
    // Clean up editor-specific attributes and elements
    clone.removeAttribute('contenteditable');
    clone.querySelectorAll('[contenteditable]').forEach(el => el.removeAttribute('contenteditable'));
    clone.querySelectorAll('.bn-block-handle, .bn-add-block-button, .bn-drag-handle').forEach(el => el.remove());
  }

  return slides;
};

