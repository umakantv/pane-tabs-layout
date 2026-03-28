import React, { useCallback, useMemo, useState } from 'react';
import { Allotment } from 'allotment';
import { Tab } from './Tab';
import { useLayout } from './LayoutContext';
import type { PaneProps, Id } from './types';

export const Pane: React.FC<PaneProps> = ({ paneId, className }) => {
  const { panes, tabs, moveTab, activateTab, closeTab, setDragData, dragData } = useLayout();
  const [isDragOver, setIsDragOver] = useState(false);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);

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

  const handleDragOver = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      e.dataTransfer.dropEffect = 'move';
      setIsDragOver(true);

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
    },
    [paneTabs.length]
  );

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    // Only clear if we're actually leaving the pane (not entering a child)
    if (!e.currentTarget.contains(e.relatedTarget as Node)) {
      setIsDragOver(false);
      setDragOverIndex(null);
    }
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragOver(false);
      setDragOverIndex(null);

      const tabId = e.dataTransfer.getData('text/plain');
      if (!tabId) return;

      const sourcePaneId = dragData?.sourcePaneId;
      if (!sourcePaneId) return;

      // Don't do anything if dropping in the same pane at the same position
      if (sourcePaneId === pane.id) {
        const currentIndex = pane.tabs.indexOf(tabId);
        if (currentIndex !== -1 && dragOverIndex !== null) {
          // Adjust index if moving within the same pane
          const adjustedIndex = dragOverIndex > currentIndex ? dragOverIndex - 1 : dragOverIndex;
          if (adjustedIndex === currentIndex) return;
        }
      }

      moveTab(tabId, sourcePaneId, pane.id, dragOverIndex ?? undefined);
      setDragData(null);
    },
    [dragData, dragOverIndex, moveTab, pane.id, pane.tabs, setDragData]
  );

  const handleTabDragStart = useCallback(
    (tabId: Id) => {
      setDragData({ tabId, sourcePaneId: pane.id });
    },
    [pane.id, setDragData]
  );

  const handleTabDragEnd = useCallback(() => {
    setDragData(null);
  }, [setDragData]);

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
        className={`ptl-pane ${isDragOver ? 'ptl-pane-drag-over' : ''} ${isCollapsed ? 'ptl-pane-collapsed' : ''}`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        {isCollapsed ? (
          <div className="ptl-collapsed-content">
            <div className="ptl-collapsed-label">Drop tabs here</div>
            {isDragOver && <div className="ptl-drop-zone-active">Release to add tab</div>}
          </div>
        ) : (
          <>
            <div className="ptl-tab-bar">
              {paneTabs.map((tab, index) => (
                <React.Fragment key={tab.id}>
                  {isDragOver && dragOverIndex === index && (
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
              {isDragOver && dragOverIndex === paneTabs.length && (
                <div className="ptl-drop-indicator" />
              )}
            </div>
            <div className="ptl-pane-content">
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
