import React, { useCallback, useMemo } from 'react';
import type { TabProps } from './types';

export const Tab: React.FC<TabProps> = ({
  tab,
  isActive,
  isDragging = false,
  isPinned = false,
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
      if (isPinned) {
        onUnpin?.();
      } else {
        onPin?.();
      }
    },
    [isPinned, onPin, onUnpin]
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

  // --- Build the default inner content (icon + title + tabExtra + pin + close) ---
  const defaultTabContent = useMemo(() => (
    <>
      {tab.icon && <span className="ptl-tab-icon">{tab.icon}</span>}
      <span className="ptl-tab-title">{tab.title}</span>
      {tab.tabExtra && <span className="ptl-tab-extra">{tab.tabExtra}</span>}
      {/* Pin toggle — visible on hover for every tab */}
      <button
        className="ptl-tab-pin"
        onClick={handlePinToggle}
        aria-label={isPinned ? `Unpin ${tab.title}` : `Pin ${tab.title}`}
        title={isPinned ? 'Unpin tab' : 'Pin tab'}
        type="button"
      >
        <svg
          width="12"
          height="12"
          viewBox="0 0 16 16"
          fill="currentColor"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path d="M4.456.734a1.75 1.75 0 0 1 2.826.504l.613 1.327a3.081 3.081 0 0 0 2.084 1.707l2.454.584c1.332.317 1.8 1.972.832 2.94L11.06 10l3.72 3.72a.75.75 0 1 1-1.06 1.06L10 11.06l-2.204 2.205c-.968.968-2.623.5-2.94-.832l-.584-2.454a3.081 3.081 0 0 0-1.707-2.084l-1.327-.613a1.75 1.75 0 0 1-.504-2.826z" />
        </svg>
      </button>
      {/* Close button — only on unpinned closable tabs */}
      {!isPinned && tab.closable !== false && onClose && (
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
    </>
  ), [tab.icon, tab.title, tab.tabExtra, tab.closable, isPinned, onClose, handleClose, handlePinToggle]);

  // --- If renderTab is provided, let the user control the inner content ---
  const innerContent = tab.renderTab
    ? tab.renderTab({ tab, isActive, isPinned, isDragging, defaultTab: defaultTabContent })
    : defaultTabContent;

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
      {innerContent}
    </div>
  );
};
