import React, { useEffect, useRef } from "react";
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

  // Initialize Reveal.js and enter fullscreen
  useEffect(() => {
    if (!revealRef.current) return;

    const deck = new Reveal(revealRef.current, {
      embedded: false,
      controls: true,
      progress: true,
      center: false,
      hash: false,
      transition: "slide",
      width: 1920,
      height: 1080,
      margin: 0.1,
    });

    deck.initialize();
    deckRef.current = deck;

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
  }, [slides]);

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
