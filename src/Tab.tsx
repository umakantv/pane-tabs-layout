import React, { useCallback } from 'react';
import type { TabProps } from './types';

export const Tab: React.FC<TabProps> = ({
  tab,
  isActive,
  isDragging = false,
  onClick,
  onClose,
  onPin,
  onUnpin,
  onDragStart,
  onDragEnd,
}) => {
  const handleClose = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      onClose?.();
    },
    [onClose]
  );

  const handlePinToggle = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      if (tab.pinned) {
        onUnpin?.();
      } else {
        onPin?.();
      }
    },
    [tab.pinned, onPin, onUnpin]
  );

  const handleDragStart = useCallback(
    (e: React.DragEvent) => {
      e.dataTransfer.effectAllowed = 'move';
      // Store the tab ID for the drop target to use
      e.dataTransfer.setData('text/plain', tab.id);
      onDragStart?.();
    },
    [tab.id, onDragStart]
  );

  const handleDragEnd = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      onDragEnd?.();
    },
    [onDragEnd]
  );

  const draggable = tab.draggable !== false;
  const isPinned = tab.pinned === true;

  // For pinned tabs: show pin icon (clicking unpins). Close only if explicitly closable:true.
  // For unpinned tabs: show close button (and pin icon on hover via CSS class)
  const showClose = !isPinned && tab.closable !== false && onClose;
  const showPin = isPinned || onPin; // always show pin affordance if pinned or pin handler exists

  return (
    <div
      className={`ptl-tab ${isActive ? 'ptl-tab-active' : ''} ${isDragging ? 'ptl-tab-dragging' : ''} ${isPinned ? 'ptl-tab-pinned' : ''}`}
      onClick={onClick}
      draggable={draggable}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      role="tab"
      aria-selected={isActive}
      data-tab-id={tab.id}
      data-pinned={isPinned || undefined}
    >
      {tab.icon && <span className="ptl-tab-icon">{tab.icon}</span>}
      <span className="ptl-tab-title">{tab.title}</span>
      {/* Pin/Unpin button */}
      {showPin && (
        <button
          className={`ptl-tab-pin ${isPinned ? 'ptl-tab-pin-active' : ''}`}
          onClick={handlePinToggle}
          aria-label={isPinned ? `Unpin ${tab.title}` : `Pin ${tab.title}`}
          type="button"
          title={isPinned ? 'Unpin tab' : 'Pin tab'}
        >
          <svg
            width="12"
            height="12"
            viewBox="0 0 24 24"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="M12 2L15 5V9.5C15 10.88 16.12 12 17.5 12H19L18 21H6L5 12H6.5C7.88 12 9 10.88 9 9.5V5L12 2Z"
              fill="currentColor"
            />
          </svg>
        </button>
      )}
      {/* Close button (hidden for pinned tabs unless closable:true) */}
      {showClose && (
        <button
          className="ptl-tab-close"
          onClick={handleClose}
          aria-label={`Close ${tab.title}`}
          type="button"
        >
          <svg
            width="12"
            height="12"
            viewBox="0 0 12 12"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="M6 5.293L10.646 0.646L11.354 1.354L6.707 6L11.354 10.646L10.646 11.354L6 6.707L1.354 11.354L0.646 10.646L5.293 6L0.646 1.354L1.354 0.646L6 5.293Z"
              fill="currentColor"
            />
          </svg>
        </button>
      )}
    </div>
  );
};
