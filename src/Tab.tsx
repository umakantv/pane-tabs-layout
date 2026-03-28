import React, { useCallback } from 'react';
import type { TabProps } from './types';

export const Tab: React.FC<TabProps> = ({
  tab,
  isActive,
  isDragging = false,
  onClick,
  onClose,
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

  return (
    <div
      className={`ptl-tab ${isActive ? 'ptl-tab-active' : ''} ${isDragging ? 'ptl-tab-dragging' : ''}`}
      onClick={onClick}
      draggable={draggable}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      role="tab"
      aria-selected={isActive}
      data-tab-id={tab.id}
    >
      {tab.icon && <span className="ptl-tab-icon">{tab.icon}</span>}
      <span className="ptl-tab-title">{tab.title}</span>
      {tab.closable !== false && onClose && (
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
