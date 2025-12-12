import React from 'react';
import { NodeViewWrapper, NodeViewContent, NodeViewProps } from '@tiptap/react';

export const SlideNodeView: React.FC<NodeViewProps> = ({ node }) => {
  const slideNumber = node.attrs.slideNumber || 1;

  return (
    <NodeViewWrapper className="bn-slide" data-node-type="slide" data-slide-number={slideNumber}>
      <div className="bn-slide-header">
        <span className="bn-slide-label">Slide {slideNumber}</span>
      </div>
      <div className="bn-slide-content">
        <NodeViewContent />
      </div>
    </NodeViewWrapper>
  );
};
