import React, { useCallback, useMemo, useState, useRef } from 'react';
import { Allotment } from 'allotment';
import { Tab } from './Tab';
import { useLayout } from './LayoutContext';
import type { PaneProps, Id, SplitDirection } from './types';

// Edge threshold for drop zones (percentage of pane size)
const EDGE_THRESHOLD = 0.25;

export const Pane: React.FC<PaneProps> = ({ paneId, className }) => {
  const { panes, tabs, moveTab, splitPane, activateTab, closeTab, setDragData, dragData, setDropZone, openLink, linkInterception } = useLayout();
  const [isDragOver, setIsDragOver] = useState(false);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);
  const [activeDropZone, setActiveDropZone] = useState<SplitDirection | 'center' | null>(null);
  const paneRef = useRef<HTMLDivElement>(null);

  // Look up pane data from context to always have fresh data
  const pane = useMemo(() => panes.get(paneId), [panes, paneId]);

  const paneTabs = useMemo(() => {
    if (!pane) return [];
    return pane.tabs
      .map((tabId) => tabs.get(tabId))
      .filter((tab): tab is NonNullable<typeof tab> => tab !== undefined);
  }, [pane, tabs]);

  const activeTabData = useMemo(() => {
    if (!pane?.activeTab) return undefined;
    return tabs.get(pane.activeTab);
  }, [pane, tabs]);

  // Return null if pane not found
  if (!pane) return null;

  // Check if pane is collapsed (no tabs or explicitly hidden)
  const isCollapsed = pane.visible === false || pane.tabs.length === 0;

  /**
   * Calculate drop zone based on mouse position within the pane
   */
  const calculateDropZone = useCallback((e: React.DragEvent): SplitDirection | 'center' => {
    if (!paneRef.current) return 'center';
    
    const rect = paneRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const width = rect.width;
    const height = rect.height;
    
    // Calculate relative position (0-1)
    const relX = x / width;
    const relY = y / height;
    
    // Check edges first
    if (relX < EDGE_THRESHOLD) return 'left';
    if (relX > 1 - EDGE_THRESHOLD) return 'right';
    if (relY < EDGE_THRESHOLD) return 'top';
    if (relY > 1 - EDGE_THRESHOLD) return 'bottom';
    
    return 'center';
  }, []);

  const handleDragOver = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      e.dataTransfer.dropEffect = 'move';
      setIsDragOver(true);
      
      const dropZone = calculateDropZone(e);
      setActiveDropZone(dropZone);
      setDropZone({ paneId, direction: dropZone });

      // Only calculate tab index if in center zone
      if (dropZone === 'center' && !isCollapsed) {
        // Calculate the index where the tab should be dropped
        const tabElements = e.currentTarget.querySelectorAll('.ptl-tab');
        let targetIndex = paneTabs.length;

        for (let i = 0; i < tabElements.length; i++) {
          const rect = tabElements[i].getBoundingClientRect();
          const midX = rect.left + rect.width / 2;
          if (e.clientX < midX) {
            targetIndex = i;
            break;
          }
        }

        setDragOverIndex(targetIndex);
      } else {
        setDragOverIndex(null);
      }
    },
    [calculateDropZone, paneTabs.length, isCollapsed, paneId, setDropZone]
  );

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    // Only clear if we're actually leaving the pane (not entering a child)
    if (!e.currentTarget.contains(e.relatedTarget as Node)) {
      setIsDragOver(false);
      setDragOverIndex(null);
      setActiveDropZone(null);
      setDropZone(null);
    }
  }, [setDropZone]);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      const dropZone = activeDropZone;
      
      setIsDragOver(false);
      setDragOverIndex(null);
      setActiveDropZone(null);
      setDropZone(null);

      const tabId = e.dataTransfer.getData('text/plain');
      if (!tabId) return;

      const sourcePaneId = dragData?.sourcePaneId;
      if (!sourcePaneId) return;

      // Handle split drop
      if (dropZone && dropZone !== 'center') {
        // Don't split if dropping in the same pane and it would be the only tab
        if (sourcePaneId === pane.id) {
          const sourcePane = panes.get(sourcePaneId);
          if (sourcePane && sourcePane.tabs.length === 1) {
            // Can't split a pane with only one tab moving to a new side of itself
            setDragData(null);
            return;
          }
        }
        splitPane(tabId, sourcePaneId, pane.id, dropZone);
        setDragData(null);
        return;
      }

      // Handle center drop (add to existing pane)
      // Don't do anything if dropping in the same pane at the same position
      if (sourcePaneId === pane.id) {
        const currentIndex = pane.tabs.indexOf(tabId);
        if (currentIndex !== -1 && dragOverIndex !== null) {
          // Adjust index if moving within the same pane
          const adjustedIndex = dragOverIndex > currentIndex ? dragOverIndex - 1 : dragOverIndex;
          if (adjustedIndex === currentIndex) {
            setDragData(null);
            return;
          }
        }
      }

      moveTab(tabId, sourcePaneId, pane.id, dragOverIndex ?? undefined);
      setDragData(null);
    },
    [activeDropZone, dragData, dragOverIndex, moveTab, splitPane, pane.id, pane.tabs, panes, setDragData, setDropZone]
  );

  const handleTabDragStart = useCallback(
    (tabId: Id) => {
      setDragData({ tabId, sourcePaneId: pane.id });
    },
    [pane.id, setDragData]
  );

  const handleTabDragEnd = useCallback(() => {
    setDragData(null);
    setDropZone(null);
  }, [setDragData, setDropZone]);

  /**
   * Handle clicks on links inside pane content (event delegation).
   * In 'auto' mode, walks up from the click target to find the nearest <a>,
   * reads its href, and calls openLink(). If openLink() handles it (returns
   * a TabData), we preventDefault. Otherwise the click proceeds normally.
   * Links with the data-ptl-external attribute are always skipped.
   */
  const handleContentClick = useCallback(
    (e: React.MouseEvent) => {
      if (linkInterception !== 'auto') return;

      // If a PaneLink (or other handler) already called preventDefault, skip
      if (e.defaultPrevented) return;

      // Walk up from the click target to find the nearest <a> element
      let target = e.target as HTMLElement;
      while (target && target !== e.currentTarget) {
        if (target.tagName === 'A') {
          // Skip links explicitly marked as external
          if (target.hasAttribute('data-ptl-external')) return;

          const href = (target as HTMLAnchorElement).href;
          if (!href) return;

          const resolved = openLink(href, paneId);
          if (resolved) {
            e.preventDefault();
          }
          // Whether resolved or not, stop walking — we found an <a>
          return;
        }
        target = target.parentElement!;
      }
    },
    [linkInterception, openLink, paneId]
  );

  /**
   * Get drop zone overlay styles based on active drop zone
   */
  const getDropZoneOverlay = () => {
    if (!isDragOver || !activeDropZone || activeDropZone === 'center') return null;
    
    const baseClass = 'ptl-drop-zone-overlay';
    
    switch (activeDropZone) {
      case 'left':
        return (
          <div className={`${baseClass} ${baseClass}-left`}>
            <div className="ptl-drop-zone-label">Split Left</div>
          </div>
        );
      case 'right':
        return (
          <div className={`${baseClass} ${baseClass}-right`}>
            <div className="ptl-drop-zone-label">Split Right</div>
          </div>
        );
      case 'top':
        return (
          <div className={`${baseClass} ${baseClass}-top`}>
            <div className="ptl-drop-zone-label">Split Top</div>
          </div>
        );
      case 'bottom':
        return (
          <div className={`${baseClass} ${baseClass}-bottom`}>
            <div className="ptl-drop-zone-label">Split Bottom</div>
          </div>
        );
    }
  };

  return (
    <Allotment.Pane
      minSize={isCollapsed ? 60 : pane.minSize}
      maxSize={pane.maxSize}
      preferredSize={isCollapsed ? 60 : pane.preferredSize}
      snap={pane.snap}
      visible={pane.visible !== false}
      className={className}
    >
      <div
        ref={paneRef}
        className={`ptl-pane ${isDragOver ? 'ptl-pane-drag-over' : ''} ${isCollapsed ? 'ptl-pane-collapsed' : ''} ${activeDropZone && activeDropZone !== 'center' ? 'ptl-pane-split-preview' : ''}`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        {getDropZoneOverlay()}
        {isCollapsed ? (
          <div className="ptl-collapsed-content">
            <div className="ptl-collapsed-label">Drop tabs here</div>
            {isDragOver && activeDropZone === 'center' && <div className="ptl-drop-zone-active">Release to add tab</div>}
          </div>
        ) : (
          <>
            <div className="ptl-tab-bar">
              {paneTabs.map((tab, index) => (
                <React.Fragment key={tab.id}>
                  {isDragOver && activeDropZone === 'center' && dragOverIndex === index && (
                    <div className="ptl-drop-indicator" />
                  )}
                  <Tab
                    tab={tab}
                    isActive={pane.activeTab === tab.id}
                    isDragging={dragData?.tabId === tab.id}
                    onClick={() => activateTab(pane.id, tab.id)}
                    onClose={() => closeTab(pane.id, tab.id)}
                    onDragStart={() => handleTabDragStart(tab.id)}
                    onDragEnd={handleTabDragEnd}
                  />
                </React.Fragment>
              ))}
              {isDragOver && activeDropZone === 'center' && dragOverIndex === paneTabs.length && (
                <div className="ptl-drop-indicator" />
              )}
            </div>
            <div className="ptl-pane-content" onClick={handleContentClick}>
              {activeTabData ? (
                activeTabData.content
              ) : (
                <div className="ptl-empty-state">No tab selected</div>
              )}
            </div>
          </>
        )}
      </div>
    </Allotment.Pane>
  );
};
