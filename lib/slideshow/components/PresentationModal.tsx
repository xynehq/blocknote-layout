import React, { useEffect, useRef, useCallback } from "react";
import { createPortal } from "react-dom";
import Reveal from "reveal.js";
import "reveal.js/dist/reveal.css";
import "reveal.js/dist/theme/white.css";
import "reveal.js/dist/theme/black.css";
import "reveal.js/dist/theme/beige.css";
import "reveal.js/dist/theme/sky.css";
import "@blocknote/mantine/style.css";
import { MdClose } from "react-icons/md";

interface PresentationModalProps {
  slides: string[];
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
    });

    deck.initialize().then(() => {
      // Auto-scale slides after Reveal.js is fully initialized
      setTimeout(() => {
        autoScaleSlides();
      }, 100);
    });
    
    deckRef.current = deck;

    // Re-scale on slide change in case of lazy loading
    deck.on('slidechanged', () => {
      autoScaleSlides();
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

  // Handle Escape key and fullscreen exit
  useEffect(() => {
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
    };
  }, [onClose]);

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
          {slides.map((slideElement, index) => (
            <section
              key={index}
              className="bn-presentation-slide"
            >
              {/* Render HTML with BlockNote classes */}
              <div 
                className="bn-container bn-default-styles"
                dangerouslySetInnerHTML={{ __html: slideElement }}
              />
            </section>
          ))}
        </div>
      </div>
    </div>,
    document.body
  );
};
