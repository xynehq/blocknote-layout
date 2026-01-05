import React, { useEffect, useRef, useCallback, useState } from "react";
import { createPortal } from "react-dom";
import Reveal from "reveal.js";
import "reveal.js/dist/reveal.css";
import "../styles/slideshow.css";
import "@blocknote/mantine/style.css";
import { MdClose } from "react-icons/md";
import { SlideContent } from "../utils/generateSlidesFromEditor.js";
import { WhiteboardSlide } from "./WhiteboardSlide.js";
import { ExpandedImageOverlay } from "./ExpandedImageOverlay.js";

interface PresentationModalProps {
  slides: SlideContent[];
  onClose: () => void;
  theme?: string;
}

export const PresentationModal: React.FC<PresentationModalProps> = ({
  slides,
  onClose,
  theme = 'white',
}) => {
  const revealRef = useRef<HTMLDivElement>(null);
  const deckRef = useRef<Reveal.Api | null>(null);
  const scrollPositionRef = useRef<number>(0);

  // Track active slide index
  const [currentSlideIndex, setCurrentSlideIndex] = useState(0);

  // Track state for expanded image
  const [expandedImage, setExpandedImage] = useState<string | null>(null);

  // Auto-scale slide content to fit within the slide
  const autoScaleSlides = useCallback(() => {
    if (!revealRef.current) return;

    const slideElements = revealRef.current.querySelectorAll('.bn-presentation-slide');
    const slideHeight = 1080; // Reveal.js configured height
    const slideWidth = 1920;  // Reveal.js configured width
    const padding = 60; // Total vertical padding (top + bottom)
    const availableHeight = slideHeight - padding;
    const availableWidth = slideWidth - 100; // Account for horizontal padding

    slideElements.forEach((slide) => {
      const container = slide.querySelector('.bn-container') as HTMLElement;
      if (!container) return;

      // Reset any previous scaling
      container.style.transform = '';
      container.style.transformOrigin = 'top left';

      // Measure the natural content size
      const contentHeight = container.scrollHeight;
      const contentWidth = container.scrollWidth;

      // Calculate scale factors for both dimensions
      const scaleY = contentHeight > availableHeight ? availableHeight / contentHeight : 1;
      const scaleX = contentWidth > availableWidth ? availableWidth / contentWidth : 1;

      // Use the smaller scale to fit both dimensions
      const scale = Math.min(scaleX, scaleY);

      // Only apply scaling if content is too large
      if (scale < 1) {
        container.style.transform = `scale(${scale})`;
        container.style.transformOrigin = 'top left';
        // Adjust the container size to prevent layout shifts
        container.style.width = `${100 / scale}%`;
      }
    });
  }, []);

  // Initialize Reveal.js and enter fullscreen
  useEffect(() => {
    if (!revealRef.current) return;

    const deck = new Reveal(revealRef.current, {
      embedded: false,
      controls: true,
      progress: true,
      center: false, // Disable centering so we control positioning
      hash: false,
      transition: "slide",
      width: 1920,
      height: 1080,
      margin: 0.04,
      minScale: 0.2,
      maxScale: 1.5,
      keyboard: true, // Enable keyboard navigation
      touch: true, // Enable touch navigation
    });

    deck.initialize().then(() => {
      // Auto-scale slides after Reveal.js is fully initialized
      setTimeout(() => {
        autoScaleSlides();
      }, 100);

      // Update index immediately after init
      if (deck) {
        setCurrentSlideIndex(deck.getIndices().h);
      }
    }).catch((err) => {
      console.error('Reveal.js initialization failed:', err);
    });

    deckRef.current = deck;

    // Re-scale on slide change in case of lazy loading
    deck.on('slidechanged', () => {
      autoScaleSlides();
      // Update index on slide change
      if (deck) {
        setCurrentSlideIndex(deck.getIndices().h);
      }
    });

    // Request fullscreen
    const presentationElement = document.querySelector('.bn-presentation-modal') as HTMLElement;
    if (presentationElement && presentationElement.requestFullscreen) {
      presentationElement.requestFullscreen().catch((err) => {
        console.warn('Could not enter fullscreen:', err);
      });
    }

    return () => {
      deck.destroy();
      // Exit fullscreen when modal closes
      if (document.fullscreenElement) {
        document.exitFullscreen().catch((err) => {
          console.warn('Could not exit fullscreen:', err);
        });
      }
    };
  }, [slides, autoScaleSlides]);

  // Handle Escape key, fullscreen exit, and scroll position
  useEffect(() => {
    // Save scroll position when modal opens
    scrollPositionRef.current = window.scrollY || document.documentElement.scrollTop;

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      }
    };

    const handleFullscreenChange = () => {
      // If user exits fullscreen manually, close the modal
      if (!document.fullscreenElement) {
        onClose();
      }
    };

    document.addEventListener("keydown", handleEscape);
    document.addEventListener("fullscreenchange", handleFullscreenChange);
    document.body.style.overflow = "hidden";

    return () => {
      document.removeEventListener("keydown", handleEscape);
      document.removeEventListener("fullscreenchange", handleFullscreenChange);
      document.body.style.overflow = "unset";

      // Restore scroll position when modal closes
      // Use requestAnimationFrame and multiple attempts for reliability on mobile
      requestAnimationFrame(() => {
        window.scrollTo(0, scrollPositionRef.current);

        setTimeout(() => {
          window.scrollTo(0, scrollPositionRef.current);

          setTimeout(() => {
            window.scrollTo(0, scrollPositionRef.current);
          }, 50);
        }, 50);
      });
    };
  }, [onClose, expandedImage]);

  // Handle image clicks to open lightbox
  useEffect(() => {
    if (!revealRef.current) return;

    const handleImageClick = (e: Event) => {
      const target = e.target as HTMLElement;
      if (target.tagName === 'IMG') {
        const imgElement = target as HTMLImageElement;
        e.preventDefault();
        e.stopPropagation();
        setExpandedImage(imgElement.src);
      }
    };

    const container = revealRef.current;
    container.addEventListener('click', handleImageClick);
    return () => container.removeEventListener('click', handleImageClick);
  }, []);

  // Lightbox close handler
  const handleExpandedImageClose = useCallback(() => setExpandedImage(null), []);

  // Render a slide based on its type
  const renderSlide = (slide: SlideContent, index: number) => {
    if (slide.type === 'whiteboard') {
      return (
        <section
          key={index}
          className="bn-presentation-slide bn-whiteboard-presentation-slide"
        >
          <WhiteboardSlide
            data={slide.data}
            title={slide.title}
            theme={theme}
            isActive={index === currentSlideIndex}
          />
        </section>
      );
    }

    // HTML slide
    return (
      <section
        key={index}
        className="bn-presentation-slide"
      >
        <div
          className="bn-container bn-default-styles"
          dangerouslySetInnerHTML={{ __html: slide.content }}
        />
      </section>
    );
  };

  return createPortal(
    <div className="bn-presentation-modal" data-id="presentation-modal" data-theme={theme}>
      {/* Close button */}
      <button
        onClick={onClose}
        className="bn-presentation-close"
        title="Exit (Esc)"
      >
        <MdClose size={24} />
      </button>

      {/* Reveal.js container */}
      <div ref={revealRef} className={`reveal theme-${theme}`}>
        <div className="slides">
          {slides.map((slide, index) => renderSlide(slide, index))}
        </div>
      </div>

      {/* Image Lightbox Overlay */}
      {expandedImage && (
        <ExpandedImageOverlay
          imageSrc={expandedImage}
          onClose={handleExpandedImageClose}
        />
      )}
    </div>,
    document.body
  );
};

