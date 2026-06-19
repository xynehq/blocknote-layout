import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { createPortal } from 'react-dom';
import type { BlockNoteEditor } from '@blocknote/core';
import EmojiPicker, { EmojiStyle } from 'emoji-picker-react';
import * as Popover from '@radix-ui/react-popover';
import type { EmojiClickData } from 'emoji-picker-react';
import { SmilePlus, MessageCircle } from 'lucide-react';
import './canvas-comment-button.css';

// Utility function to combine class names
const cn = (...classes: (string | undefined | null | false)[]): string => {
  return classes.filter(Boolean).join(' ');
};

// Button component using basic HTML
const Button = React.forwardRef<
  HTMLButtonElement,
  React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: string }
>(({ className, variant, ...props }, ref) => {
  const variants: Record<string, string> = {
    ghost: 'bg-transparent hover:bg-transparent text-muted-foreground',
    default: 'bg-primary text-primary-foreground',
  };
  
  return (
    <button
      ref={ref}
      className={cn(variants[variant || 'default'], className)}
      {...props}
    />
  );
});
Button.displayName = 'Button';

export interface CanvasCommentButtonProps {
  editor: BlockNoteEditor<any, any, any>;
  blockReactions: Record<string, Record<string, string[]>>; // blockId -> emoji -> userIds[]
  commentCounts: Record<string, number>; // blockId -> count
  blockThreads?: Record<string, Array<{ threadId: string; threadData: any; commentCount: number }>>; // blockId -> threads
  onAddReaction: (blockId: string, emoji: string) => void;
  onRemoveReaction: (blockId: string, emoji: string) => void;
  onCommentClick: (blockId: string) => void;
  onThreadClick?: (blockId: string, threadId: string) => void;
  isCommentPanelOpen?: boolean;
  user?: any; // Optional user object with id property
  users?: Array<{ id: string; name: string }> | undefined; // Users list for tooltip display
  TooltipComponent?: React.ComponentType<{ content: string; side?: 'top'; delayDuration?: number; children: React.ReactNode }>;
}

export const CanvasCommentButton: React.FC<CanvasCommentButtonProps> = ({
  editor: _editor,
  blockReactions,
  commentCounts,
  blockThreads,
  onAddReaction,
  onRemoveReaction,
  onCommentClick,
  onThreadClick,
  isCommentPanelOpen,
  user,
  users,
  TooltipComponent,
}) => {
  const [hoveredBlockId, setHoveredBlockId] = useState<string | null>(null);
  const [isHoveringButton, setIsHoveringButton] = useState(false);
  const [emojiPickerOpen, setEmojiPickerOpen] = useState<string | null>(null);
  const hideTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const buttonRef = useRef<HTMLDivElement>(null);

  // Blocks with reactions or comments (show persistent buttons)
  const blocksWithActivity = useMemo(() => {
    const set = new Set<string>();
    // Blocks with reactions
    Object.keys(blockReactions || {}).forEach(blockId => {
      if (blockReactions[blockId] && Object.keys(blockReactions[blockId]).length > 0) {
        set.add(blockId);
      }
    });
    // Blocks with comments
    Object.entries(commentCounts).forEach(([blockId, count]) => {
      if (count > 0) {
        set.add(blockId);
      }
    });
    return Array.from(set);
  }, [blockReactions, commentCounts]);

  const clearHideTimeout = useCallback(() => {
    if (hideTimeoutRef.current) {
      clearTimeout(hideTimeoutRef.current);
      hideTimeoutRef.current = null;
    }
  }, []);

  const scheduleHide = useCallback(() => {
    clearHideTimeout();
    hideTimeoutRef.current = setTimeout(() => {
      setHoveredBlockId(null);
      setIsHoveringButton(false);
      setEmojiPickerOpen(null);
    }, 150);
  }, [clearHideTimeout]);

  // Close emoji picker when hovered block changes
  useEffect(() => {
    setEmojiPickerOpen(null);
  }, [hoveredBlockId]);

  // Track mouse movement for hover detection
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      const target = e.target as HTMLElement;

      // Check if hovering over button or picker
      if (buttonRef.current && buttonRef.current.contains(target)) {
        clearHideTimeout();
        setIsHoveringButton(true);
        return;
      }

      const pickerElement = document.querySelector('[class*="emoji-picker"]');
      if (pickerElement && pickerElement.contains(target)) {
        clearHideTimeout();
        return;
      }

      // Check if hovering over block
      const blockElement = target.closest('.bn-block') as HTMLElement | null;
      if (blockElement) {
        const blockId = blockElement.getAttribute('data-id');
        // Only set hover if block has no activity (reactions or comments)
        // Persistent buttons handle blocks with activity
        if (blockId && blockId !== hoveredBlockId && !blocksWithActivity.includes(blockId)) {
          clearHideTimeout();
          setHoveredBlockId(blockId);
        }
      } else {
        if (!isHoveringButton && !emojiPickerOpen) {
          scheduleHide();
        }
      }
    };

    document.addEventListener('mousemove', handleMouseMove);
    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
    };
  }, [isHoveringButton, emojiPickerOpen, clearHideTimeout, scheduleHide, hoveredBlockId, blocksWithActivity]);

  const handleToggleReaction = useCallback(
    (blockId: string, emoji: string) => {
      if (user?.id) {
        const reactions = blockReactions[blockId] || {};
        const userIds = reactions[emoji] || [];
        const hasReacted = userIds.includes(user.id);

        if (hasReacted) {
          onRemoveReaction(blockId, emoji);
        } else {
          onAddReaction(blockId, emoji);
        }
      }
      setEmojiPickerOpen(null);
    },
    [blockReactions, user?.id, onAddReaction, onRemoveReaction],
  );

  return (
    <>
      {/* Persistent activity buttons for blocks with reactions/comments */}
      {blocksWithActivity.map(blockId => {
        const blockReactionData = blockReactions[blockId] || {};
        const commentCount = commentCounts[blockId] || 0;
        const reactionEmojis = Object.keys(blockReactionData);

        return (
          <PersistentActivityButton
            key={blockId}
            blockId={blockId}
            reactionEmojis={reactionEmojis}
            reactions={blockReactionData}
            commentCount={commentCount}
            user={user}
            onCommentClick={() => onCommentClick(blockId)}
            threads={blockThreads?.[blockId] || []}
            onThreadClick={onThreadClick}
            isCommentPanelOpen={isCommentPanelOpen}
            users={users}
            TooltipComponent={TooltipComponent}
          />
        );
      })}

      {/* Hover buttons for blocks without activity */}
      {hoveredBlockId && !blocksWithActivity.includes(hoveredBlockId) && (
        <HoverActivityButton
          blockId={hoveredBlockId}
          onReactionButtonHover={() => {
            clearHideTimeout();
            setIsHoveringButton(true);
          }}
          onReactionButtonLeave={() => {
            setIsHoveringButton(false);
            scheduleHide();
          }}
          onEmojiSelect={(emoji) => {
            handleToggleReaction(hoveredBlockId, emoji);
          }}
          onCommentClick={() => onCommentClick(hoveredBlockId)}
          emojiPickerOpen={emojiPickerOpen === hoveredBlockId}
          onEmojiPickerOpenChange={(open) => {
            setEmojiPickerOpen(open ? hoveredBlockId : null);
            if (open) clearHideTimeout();
          }}
          isCommentPanelOpen={isCommentPanelOpen}
          TooltipComponent={TooltipComponent}
          ref={buttonRef}
        />
      )}
    </>
  );
};

// Simple reaction display showing all emojis used and total count
interface ReactionButtonsProps {
  reactionEmojis: string[];
  reactions: Record<string, string[]>;
  usersById: Map<string, { name: string }>;
  TooltipComponent?: React.ComponentType<{ content: string; side?: 'top'; delayDuration?: number; children: React.ReactNode }>;
}

const ReactionButtons: React.FC<ReactionButtonsProps> = React.memo(({
  reactionEmojis,
  reactions,
  usersById,
  TooltipComponent,
}) => {
  // Calculate total reaction count
  let totalCount = 0;
  const allUserIds = new Set<string>();

  reactionEmojis.forEach(emoji => {
    const userIds = reactions[emoji] || [];
    totalCount += userIds.length;
    userIds.forEach(id => allUserIds.add(id));
  });

  // Build tooltip with all user names
  const userNames = Array.from(allUserIds).map(id => usersById.get(id)?.name || 'Unknown').join(', ');
  const verb = allUserIds.size === 1 ? 'has' : 'have';
  const tooltipTitle = `${userNames} ${verb} reacted`;

  const display = (
    <div
      className='bn-activity-btn bn-reaction-btn-with-count'
      style={{ cursor: 'default' }}
    >
      {reactionEmojis.map(emoji => (
        <span key={emoji} className='emoji' style={{ marginRight: '2px' }}>{emoji}</span>
      ))}
      {totalCount > 0 && <span className='count'>{totalCount}</span>}
    </div>
  );

  // Use custom Tooltip component if provided, otherwise use native title
  if (TooltipComponent) {
    return (
      <TooltipComponent content={tooltipTitle} side="top" delayDuration={100}>
        {display}
      </TooltipComponent>
    );
  }

  return React.cloneElement(display, { title: tooltipTitle });
});

ReactionButtons.displayName = 'ReactionButtons';

// Persistent button showing reactions and comments with counts
interface PersistentActivityButtonProps {
  blockId: string;
  reactionEmojis: string[];
  reactions: Record<string, string[]>; // emoji -> userIds[]
  commentCount: number;
  threads?: Array<{ threadId: string; threadData: any; commentCount: number }>;
  user: any;
  onCommentClick: () => void;
  onThreadClick?: ((blockId: string, threadId: string) => void) | undefined;
  isCommentPanelOpen?: boolean | undefined;
  users?: Array<{ id: string; name: string }> | undefined;
  TooltipComponent?: React.ComponentType<{ content: string; side?: 'top'; delayDuration?: number; children: React.ReactNode }>;
}

const PersistentActivityButton: React.FC<PersistentActivityButtonProps> = ({
  blockId,
  reactionEmojis,
  reactions,
  commentCount,
  threads = [],
  user: _user,
  onCommentClick,
  onThreadClick,
  isCommentPanelOpen,
  users,
  TooltipComponent,
}) => {
  const [position, setPosition] = useState<{ top: number; left: number } | null>(null);
  const [threadsPopoverOpen, setThreadsPopoverOpen] = useState(false);

  const usersById = useMemo(() => {
    const map = new Map<string, { name: string }>();
    for (const u of users || []) {
      map.set(u.id, { name: u.name });
    }
    return map;
  }, [users]);


  useEffect(() => {
    const updatePosition = () => {
      const blockElement = document.querySelector(`[data-id="${blockId}"]`) as HTMLElement | null;
      if (blockElement) {
        const rect = blockElement.getBoundingClientRect();
        const buttonHeight = 36;
        const padding = 12;

        // Check if block is visible in viewport
        const isVisible = rect.top < window.innerHeight && rect.bottom > 0;

        if (!isVisible) {
          // Hide button when block is out of view
          setPosition(null);
          return;
        }

        // Always position to the right of the block
        let left = rect.right + padding;

        // Center vertically relative to block
        let top = rect.top + rect.height / 2 - buttonHeight / 2;

        const margin = 100; // Hide when within 100px of viewport edge

        if (rect.top < margin || rect.bottom > window.innerHeight - margin) {
          setPosition(null);
          return;
        }

        setPosition({ top, left });
      }
    };

    // Initial update
    updatePosition();

    // When panel state changes, we need multiple updates during the CSS transition
    // slideIn is 0.2s, slideOut is 0.3s - update several times during this period
    const transitionTimeouts: NodeJS.Timeout[] = [];
    if (isCommentPanelOpen !== undefined) {
      [50, 150, 300, 400].forEach(delay => {
        transitionTimeouts.push(setTimeout(updatePosition, delay));
      });
    }

    // Use requestAnimationFrame for smooth updates during scroll
    let rafId: number | null = null;
    let lastUpdate = 0;
    const throttledUpdate = () => {
      const now = Date.now();
      if (now - lastUpdate < 16) return; // Max ~60fps
      lastUpdate = now;

      if (rafId) cancelAnimationFrame(rafId);
      rafId = requestAnimationFrame(updatePosition);
    };

    window.addEventListener('scroll', throttledUpdate, { capture: true, passive: true });
    window.addEventListener('resize', updatePosition, { passive: true });

    // Also update periodically as a fallback
    const interval = setInterval(updatePosition, 50);

    return () => {
      transitionTimeouts.forEach(clearTimeout);
      window.removeEventListener('scroll', updatePosition, true);
      window.removeEventListener('resize', updatePosition);
      if (rafId) cancelAnimationFrame(rafId);
      clearInterval(interval);
    };
  }, [blockId, isCommentPanelOpen]);

  if (!position) return null;

  const hasReactions = reactionEmojis.length > 0;
  const hasComments = commentCount > 0;

  return createPortal(
    <div
      className='bn-block-activity-button'
      style={{
        position: 'fixed',
        top: position.top,
        left: position.left,
        zIndex: 999,
      }}
    >
      {/* Reactions - display only, click on markText to interact */}
      {hasReactions && (
        <ReactionButtons
          reactionEmojis={reactionEmojis}
          reactions={reactions}
          usersById={usersById}
          TooltipComponent={TooltipComponent}
        />
      )}

      {/* Comments - only show if no reactions (mutually exclusive) */}
      {hasComments && !hasReactions && threads && threads.length > 1 ? (
        // Multiple threads: show popover with list
        <Popover.Root open={threadsPopoverOpen} onOpenChange={setThreadsPopoverOpen}>
          <Popover.Trigger asChild>
            {TooltipComponent ? (
              <TooltipComponent content={`${commentCount} comment${commentCount > 1 ? 's' : ''}`} side='top' delayDuration={100}>
                <button
                  className='bn-activity-btn bn-comment-btn-with-count'
                  onClick={(e) => e.stopPropagation()}
                  type='button'
                >
                  <MessageCircle className='w-4 h-4' />
                  {commentCount > 0 && <span className='count'>{commentCount}</span>}
                </button>
              </TooltipComponent>
            ) : (
              <button
                className='bn-activity-btn bn-comment-btn-with-count'
                onClick={(e) => e.stopPropagation()}
                title={`${commentCount} comment${commentCount > 1 ? 's' : ''}`}
                type='button'
              >
                <MessageCircle className='w-4 h-4' />
                {commentCount > 0 && <span className='count'>{commentCount}</span>}
              </button>
            )}
          </Popover.Trigger>
          <Popover.Portal>
            <Popover.Content
              className='z-[1000] bg-popover rounded-lg shadow-md p-1'
              align='start'
              side='bottom'
              sideOffset={8}
              style={{ width: '120px' }}
            >
              <div className='bn-threads-list'>
                {threads.map((thread) => (
                  <button
                    key={thread.threadId}
                    className='bn-thread-item'
                    onClick={() => {
                      onThreadClick?.(blockId, thread.threadId);
                      setThreadsPopoverOpen(false);
                    }}
                    type='button'
                    title={`${thread.commentCount} comment${thread.commentCount > 1 ? 's' : ''}`}
                  >
                    <MessageCircle className='w-3 h-3 flex-shrink-0' />
                    <span className='bn-thread-count'>{thread.commentCount}</span>
                  </button>
                ))}
              </div>
            </Popover.Content>
          </Popover.Portal>
        </Popover.Root>
      ) : hasComments && !hasReactions ? (
        // Single thread: open directly
        TooltipComponent ? (
          <TooltipComponent content={`${commentCount} comment${commentCount > 1 ? 's' : ''}`} side='top' delayDuration={100}>
            <button
              className='bn-activity-btn bn-comment-btn-with-count'
              onClick={onCommentClick}
              type='button'
            >
              <MessageCircle className='w-4 h-4' />
              {commentCount > 0 && <span className='count'>{commentCount}</span>}
            </button>
          </TooltipComponent>
        ) : (
          <button
            className='bn-activity-btn bn-comment-btn-with-count'
            onClick={onCommentClick}
            title={`${commentCount} comment${commentCount > 1 ? 's' : ''}`}
            type='button'
          >
            <MessageCircle className='w-4 h-4' />
            {commentCount > 0 && <span className='count'>{commentCount}</span>}
          </button>
        )
      ) : null}

    </div>,
    document.body,
  );
};

// Hover buttons for blocks without activity
interface HoverActivityButtonProps {
  blockId: string;
  onReactionButtonHover: () => void;
  onReactionButtonLeave: () => void;
  onEmojiSelect: (emoji: string) => void;
  onCommentClick: () => void;
  emojiPickerOpen: boolean;
  onEmojiPickerOpenChange: (open: boolean) => void;
  isCommentPanelOpen?: boolean | undefined;
  TooltipComponent?: React.ComponentType<{ content: string; side?: 'top'; delayDuration?: number; children: React.ReactNode }>;
}

const HoverActivityButton = React.forwardRef<HTMLDivElement, HoverActivityButtonProps>(
  (
    {
      blockId,
      onReactionButtonHover,
      onReactionButtonLeave,
      onEmojiSelect,
      onCommentClick,
      emojiPickerOpen,
      onEmojiPickerOpenChange,
      isCommentPanelOpen,
      TooltipComponent,
    },
    ref,
  ) => {
    const [position, setPosition] = useState<{ top: number; left: number } | null>(null);

    useEffect(() => {
      const updatePosition = () => {
        const blockElement = document.querySelector(`[data-id="${blockId}"]`) as HTMLElement | null;
        if (blockElement) {
          const rect = blockElement.getBoundingClientRect();
          const buttonHeight = 36;
          const padding = 12;

          // Always position to the right of the block
          let left = rect.right + padding;

          // Center vertically relative to block
          let top = rect.top + rect.height / 2 - buttonHeight / 2;

          setPosition({ top, left });
        }
      };

      // Initial update
      updatePosition();

      // When panel state changes, we need multiple updates during the CSS transition
      // slideIn is 0.2s, slideOut is 0.3s - update several times during this period
      const transitionTimeouts: NodeJS.Timeout[] = [];
      if (isCommentPanelOpen !== undefined) {
        [50, 150, 300, 400].forEach(delay => {
          transitionTimeouts.push(setTimeout(updatePosition, delay));
        });
      }

      window.addEventListener('scroll', updatePosition, true);
      window.addEventListener('resize', updatePosition);

      // Only update position periodically if emoji picker is not open
      const interval = setInterval(() => {
        if (!emojiPickerOpen) {
          updatePosition();
        }
      }, 100);

      return () => {
        transitionTimeouts.forEach(clearTimeout);
        window.removeEventListener('scroll', updatePosition, true);
        window.removeEventListener('resize', updatePosition);
        clearInterval(interval);
      };
    }, [blockId, isCommentPanelOpen, emojiPickerOpen]);

    if (!position) return null;

    return createPortal(
      <div
        ref={ref}
        className='bn-block-hover-buttons'
        style={{
          position: 'fixed',
          top: position.top,
          left: position.left,
          zIndex: 999,
        }}
        onMouseEnter={onReactionButtonHover}
        onMouseLeave={onReactionButtonLeave}
      >
        {/* Reaction button with emoji picker */}
        <Popover.Root open={emojiPickerOpen} onOpenChange={onEmojiPickerOpenChange}>
          {TooltipComponent ? (
            <TooltipComponent content='Add reaction' side='top'>
              <Popover.Trigger asChild>
                <button
                  className='bn-activity-btn'
                  type='button'
                >
                  <SmilePlus className='w-4 h-4' />
                </button>
              </Popover.Trigger>
            </TooltipComponent>
          ) : (
            <Popover.Trigger asChild>
              <button
                className='bn-activity-btn'
                title='Add reaction'
                type='button'
              >
                <SmilePlus className='w-4 h-4' />
              </button>
            </Popover.Trigger>
          )}
          <Popover.Portal>
            <Popover.Content
              className='z-[1000] bg-popover rounded-lg shadow-md p-0'
              align='start'
              side='bottom'
              sideOffset={8}
            >
              <EmojiPicker
                style={{ width: '320px' }}
                emojiStyle={EmojiStyle.NATIVE}
                onEmojiClick={(emoji: EmojiClickData) => {
                  const emojiName = emoji.isCustom
                    ? `custom:${emoji.emoji}:${emoji.names[0] || 'custom'}`
                    : emoji.emoji;
                  onEmojiSelect(emojiName);
                }}
                searchPlaceholder='Search emoji...'
              />
            </Popover.Content>
          </Popover.Portal>
        </Popover.Root>

        {/* Comment button */}
        {TooltipComponent ? (
          <TooltipComponent content='Add comment' side='top'>
            <Button
              variant='ghost'
              className='size-8 text-muted-foreground p-0'
              onClick={onCommentClick}
            >
              <MessageCircle className='w-4 h-4' />
            </Button>
          </TooltipComponent>
        ) : (
          <Button
            variant='ghost'
            className='size-8 text-muted-foreground p-0'
            title='Add comment'
            onClick={onCommentClick}
          >
            <MessageCircle className='w-4 h-4' />
          </Button>
        )}
      </div>,
      document.body,
    );
  },
);

HoverActivityButton.displayName = 'HoverActivityButton';
