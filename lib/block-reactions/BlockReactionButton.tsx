import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { createPortal } from 'react-dom';
import type { BlockNoteEditor } from '@blocknote/core';
import EmojiPicker, { EmojiStyle } from 'emoji-picker-react';
import * as Popover from '@radix-ui/react-popover';
import type { EmojiClickData } from 'emoji-picker-react';
import { SmilePlus, MessageCircle } from 'lucide-react';
import './block-reaction-button.css';

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

export interface BlockReactionButtonProps {
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
}

export const BlockReactionButton: React.FC<BlockReactionButtonProps> = ({
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
            onToggleReaction={(emoji) => handleToggleReaction(blockId, emoji)}
            onCommentClick={() => onCommentClick(blockId)}
            threads={blockThreads?.[blockId] || []}
            onThreadClick={onThreadClick}
            emojiPickerOpen={emojiPickerOpen === blockId}
            onEmojiPickerOpenChange={(open) => {
              setEmojiPickerOpen(open ? blockId : null);
              if (open) clearHideTimeout();
            }}
            isCommentPanelOpen={isCommentPanelOpen}
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
          ref={buttonRef}
        />
      )}
    </>
  );
};

// Persistent button showing reactions and comments with counts
interface PersistentActivityButtonProps {
  blockId: string;
  reactionEmojis: string[];
  reactions: Record<string, string[]>; // emoji -> userIds[]
  commentCount: number;
  threads?: Array<{ threadId: string; threadData: any; commentCount: number }>;
  user: any;
  onToggleReaction: (emoji: string) => void;
  onCommentClick: () => void;
  onThreadClick?: ((blockId: string, threadId: string) => void) | undefined;
  emojiPickerOpen: boolean;
  onEmojiPickerOpenChange: (open: boolean) => void;
  isCommentPanelOpen?: boolean | undefined;
}

const PersistentActivityButton: React.FC<PersistentActivityButtonProps> = ({
  blockId,
  reactionEmojis,
  reactions,
  commentCount,
  threads = [],
  user,
  onToggleReaction,
  onCommentClick,
  onThreadClick,
  emojiPickerOpen,
  onEmojiPickerOpenChange,
  isCommentPanelOpen,
}) => {
  const [position, setPosition] = useState<{ top: number; left: number } | null>(null);
  const [threadsPopoverOpen, setThreadsPopoverOpen] = useState(false);

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

        // Check bottom bounds
        if (top + buttonHeight > window.innerHeight) {
          top = window.innerHeight - buttonHeight - padding;
        }
        // Check top bounds
        if (top < 0) {
          top = padding;
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
      {/* Reactions */}
      {hasReactions &&
        reactionEmojis.map(emoji => {
          const userIds = reactions[emoji] || [];
          const hasUserReacted = user?.id ? userIds.includes(user.id) : false;

          return (
            <button
              key={emoji}
              className={cn(
                'bn-activity-btn bn-reaction-btn-with-count',
                hasUserReacted && 'bn-activity-btn--active',
              )}
              onClick={() => onToggleReaction(emoji)}
              title={`${userIds.length} reaction${userIds.length > 1 ? 's' : ''}`}
              type='button'
            >
              <span className='emoji'>{emoji}</span>
              {userIds.length > 0 && <span className='count'>{userIds.length}</span>}
            </button>
          );
        })}

      {/* Comments - only show if no reactions (mutually exclusive) */}
      {hasComments && !hasReactions && threads && threads.length > 1 ? (
        // Multiple threads: show popover with list
        <Popover.Root open={threadsPopoverOpen} onOpenChange={setThreadsPopoverOpen}>
          <Popover.Trigger asChild>
            <button
              className='bn-activity-btn bn-comment-btn-with-count'
              onClick={(e) => e.stopPropagation()}
              title={`${commentCount} comment${commentCount > 1 ? 's' : ''}`}
              type='button'
            >
              <MessageCircle className='w-4 h-4' />
              {commentCount > 0 && <span className='count'>{commentCount}</span>}
            </button>
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
        <button
          className='bn-activity-btn bn-comment-btn-with-count'
          onClick={onCommentClick}
          title={`${commentCount} comment${commentCount > 1 ? 's' : ''}`}
          type='button'
        >
          <MessageCircle className='w-4 h-4' />
          {commentCount > 0 && <span className='count'>{commentCount}</span>}
        </button>
      ) : null}

      {/* Add reaction button - only show if no comments (mutually exclusive) */}
      {!hasComments && (
        <Popover.Root open={emojiPickerOpen} onOpenChange={onEmojiPickerOpenChange}>
          <Popover.Trigger asChild>
            <Button
              variant='ghost'
              className='size-8 text-muted-foreground p-0'
              title='Add reaction'
              onClick={(e) => e.stopPropagation()}
            >
              <SmilePlus className='w-4 h-4' />
            </Button>
          </Popover.Trigger>
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
                  onToggleReaction(emojiName);
                }}
                searchPlaceholder='Search emoji...'
              />
            </Popover.Content>
          </Popover.Portal>
        </Popover.Root>
      )}
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
          <Popover.Trigger asChild>
            <Button
              variant='ghost'
              className='size-8 text-muted-foreground p-0'
              title='Add reaction'
              onClick={(e) => e.stopPropagation()}
            >
              <SmilePlus className='w-4 h-4' />
            </Button>
          </Popover.Trigger>
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
        <Button
          variant='ghost'
          className='size-8 text-muted-foreground p-0'
          title='Add comment'
          onClick={onCommentClick}
        >
          <MessageCircle className='w-4 h-4' />
        </Button>
      </div>,
      document.body,
    );
  },
);

HoverActivityButton.displayName = 'HoverActivityButton';
