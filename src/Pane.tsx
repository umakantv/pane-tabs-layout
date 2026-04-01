import React, { useCallback, useEffect, useMemo, useState, useRef } from "react";
import { createPortal } from "react-dom";
import { Allotment } from "allotment";
import { Tab } from "./Tab";
import { useLayout } from "./LayoutContext";
import type { PaneProps, Id, SplitDirection } from "./types";

// Edge threshold for drop zones (percentage of pane size)
const EDGE_THRESHOLD = 0.25;

export const Pane: React.FC<PaneProps> = ({ paneId, className }) => {
  const {
    panes,
    tabs,
    moveTab,
    splitPane,
    activateTab,
    closeTab,
    setDragData,
    dragData,
    setDropZone,
    openLink,
    linkInterception,
    maximizedPaneId,
    maximizePane,
    restorePane,
    pinTab,
    unpinTab,
    tabBarActions,
  } = useLayout();
  const isMaximized = maximizedPaneId === paneId;
  const [isDragOver, setIsDragOver] = useState(false);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);
  const [activeDropZone, setActiveDropZone] = useState<
    SplitDirection | "center" | null
  >(null);
  const paneRef = useRef<HTMLDivElement>(null);
  const tabBarRef = useRef<HTMLDivElement>(null);

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
  const calculateDropZone = useCallback(
    (e: React.DragEvent): SplitDirection | "center" => {
      if (!paneRef.current) return "center";

      const rect = paneRef.current.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      const width = rect.width;
      const height = rect.height;

      // Calculate relative position (0-1)
      const relX = x / width;
      const relY = y / height;

      // Check edges first
      if (relX < EDGE_THRESHOLD) return "left";
      if (relX > 1 - EDGE_THRESHOLD) return "right";
      if (relY < EDGE_THRESHOLD) return "top";
      if (relY > 1 - EDGE_THRESHOLD) return "bottom";

      return "center";
    },
    []
  );

  const handleDragOver = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      e.dataTransfer.dropEffect = "move";
      setIsDragOver(true);

      // When dragging over the tab bar header, only allow tab reordering
      // (center zone) — don't trigger split-pane drop zones there.
      // This ensures users can reorder tabs to the first/last position
      // without accidentally activating the left/right split zones.
      let dropZone: SplitDirection | "center";
      const tabBarEl = tabBarRef.current;
      if (tabBarEl && e.clientY <= tabBarEl.getBoundingClientRect().bottom) {
        dropZone = "center";
      } else {
        dropZone = calculateDropZone(e);
      }

      setActiveDropZone(dropZone);
      setDropZone({ paneId, direction: dropZone });

      // Only calculate tab index if in center zone
      if (dropZone === "center" && !isCollapsed) {
        // Calculate the index where the tab should be dropped
        const tabElements = e.currentTarget.querySelectorAll(".ptl-tab");
        let targetIndex = paneTabs.length;

        for (let i = 0; i < tabElements.length; i++) {
          const rect = tabElements[i].getBoundingClientRect();
          const midX = rect.left + rect.width / 2;
          if (e.clientX < midX) {
            targetIndex = i;
            break;
          }
        }

        // Clamp target index based on whether the dragged tab is pinned
        const draggedTab = dragData ? tabs.get(dragData.tabId) : null;
        const pinnedCount = paneTabs.filter((t) => t.pinned).length;
        if (draggedTab?.pinned) {
          targetIndex = Math.min(targetIndex, pinnedCount);
        } else {
          targetIndex = Math.max(targetIndex, pinnedCount);
        }

        setDragOverIndex(targetIndex);
      } else {
        setDragOverIndex(null);
      }
    },
    [calculateDropZone, paneTabs.length, isCollapsed, paneId, setDropZone]
  );

  const handleDragLeave = useCallback(
    (e: React.DragEvent) => {
      // Only clear if we're actually leaving the pane (not entering a child)
      if (!e.currentTarget.contains(e.relatedTarget as Node)) {
        setIsDragOver(false);
        setDragOverIndex(null);
        setActiveDropZone(null);
        setDropZone(null);
      }
    },
    [setDropZone]
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      const dropZone = activeDropZone;

      setIsDragOver(false);
      setDragOverIndex(null);
      setActiveDropZone(null);
      setDropZone(null);

      const tabId = e.dataTransfer.getData("text/plain");
      if (!tabId) return;

      const sourcePaneId = dragData?.sourcePaneId;
      if (!sourcePaneId) return;

      // Handle split drop
      if (dropZone && dropZone !== "center") {
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
          const adjustedIndex =
            dragOverIndex > currentIndex ? dragOverIndex - 1 : dragOverIndex;
          if (adjustedIndex === currentIndex) {
            setDragData(null);
            return;
          }
        }
      }

      moveTab(tabId, sourcePaneId, pane.id, dragOverIndex ?? undefined);
      setDragData(null);
    },
    [
      activeDropZone,
      dragData,
      dragOverIndex,
      moveTab,
      splitPane,
      pane.id,
      pane.tabs,
      panes,
      setDragData,
      setDropZone,
    ]
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
      if (linkInterception !== "auto") return;

      // If a PaneLink (or other handler) already called preventDefault, skip
      if (e.defaultPrevented) return;

      // Walk up from the click target to find the nearest <a> element
      let target = e.target as HTMLElement;
      while (target && target !== e.currentTarget) {
        if (target.tagName === "A") {
          // Skip links explicitly marked as external
          if (target.hasAttribute("data-ptl-external")) return;

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
   * Double-click on the tab bar's empty area toggles maximize/restore.
   * Clicks on individual tabs or the maximize button itself are ignored.
   */
  const handleTabBarDoubleClick = useCallback(
    (e: React.MouseEvent) => {
      const target = e.target as HTMLElement;
      if (target.closest(".ptl-tab") || target.closest(".ptl-maximize-btn"))
        return;
      if (isMaximized) {
        restorePane();
      } else {
        maximizePane(paneId);
      }
    },
    [isMaximized, maximizePane, restorePane, paneId]
  );

  const handleMaximizeToggle = useCallback(() => {
    if (isMaximized) {
      restorePane();
    } else {
      maximizePane(paneId);
    }
  }, [isMaximized, maximizePane, restorePane, paneId]);

  // ---- Context menu (right-click on tabs) ----
  const [contextMenu, setContextMenu] = useState<{
    tabId: Id;
    x: number;
    y: number;
  } | null>(null);
  const contextMenuRef = useRef<HTMLDivElement>(null);

  /**
   * Right-click on a tab opens a context menu with Pin / Unpin and Close.
   * Uses event delegation on the tab bar — walks up to find .ptl-tab.
   */
  const handleTabBarContextMenu = useCallback(
    (e: React.MouseEvent) => {
      let target = e.target as HTMLElement;
      while (target && target !== e.currentTarget) {
        if (target.classList.contains("ptl-tab")) {
          const tabId = target.getAttribute("data-tab-id");
          if (tabId) {
            e.preventDefault();
            setContextMenu({ tabId, x: e.clientX, y: e.clientY });
          }
          return;
        }
        target = target.parentElement!;
      }
    },
    []
  );

  // Close context menu on outside click, Escape, scroll, resize, or blur
  useEffect(() => {
    if (!contextMenu) return;

    const handleMouseDown = (e: MouseEvent) => {
      if (
        contextMenuRef.current &&
        !contextMenuRef.current.contains(e.target as Node)
      ) {
        setContextMenu(null);
      }
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setContextMenu(null);
    };

    const handleDismiss = () => setContextMenu(null);

    // Delay mousedown listener so the opening right-click doesn't immediately close the menu
    const rafId = requestAnimationFrame(() => {
      document.addEventListener("mousedown", handleMouseDown);
    });
    document.addEventListener("keydown", handleKeyDown);
    window.addEventListener("scroll", handleDismiss, true);
    window.addEventListener("resize", handleDismiss);
    window.addEventListener("blur", handleDismiss);

    return () => {
      cancelAnimationFrame(rafId);
      document.removeEventListener("mousedown", handleMouseDown);
      document.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("scroll", handleDismiss, true);
      window.removeEventListener("resize", handleDismiss);
      window.removeEventListener("blur", handleDismiss);
    };
  }, [contextMenu]);

  // Look up the tab for the open context menu (null-safe if tab was removed)
  const contextMenuTab = contextMenu ? tabs.get(contextMenu.tabId) : null;

  /**
   * Get drop zone overlay styles based on active drop zone
   */
  const getDropZoneOverlay = () => {
    if (!isDragOver || !activeDropZone || activeDropZone === "center")
      return null;

    const baseClass = "ptl-drop-zone-overlay";

    switch (activeDropZone) {
      case "left":
        return (
          <div className={`${baseClass} ${baseClass}-left`}>
            <div className="ptl-drop-zone-label">Split Left</div>
          </div>
        );
      case "right":
        return (
          <div className={`${baseClass} ${baseClass}-right`}>
            <div className="ptl-drop-zone-label">Split Right</div>
          </div>
        );
      case "top":
        return (
          <div className={`${baseClass} ${baseClass}-top`}>
            <div className="ptl-drop-zone-label">Split Top</div>
          </div>
        );
      case "bottom":
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
        className={`ptl-pane ${isDragOver ? "ptl-pane-drag-over" : ""} ${
          isCollapsed ? "ptl-pane-collapsed" : ""
        } ${
          activeDropZone && activeDropZone !== "center"
            ? "ptl-pane-split-preview"
            : ""
        }`}
        data-maximized={isMaximized || undefined}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        {getDropZoneOverlay()}
        {isCollapsed ? (
          <div className="ptl-collapsed-content">
            <div className="ptl-collapsed-label">Drop tabs here</div>
            {isDragOver && activeDropZone === "center" && (
              <div className="ptl-drop-zone-active">Release to add tab</div>
            )}
          </div>
        ) : (
          <>
            <div
              ref={tabBarRef}
              className="ptl-tab-bar"
              onDoubleClick={handleTabBarDoubleClick}
              onContextMenu={handleTabBarContextMenu}
            >
              {paneTabs.map((tab, index) => {
                const isPinned = !!tab.pinned;
                const pinnedCount = paneTabs.filter((t) => t.pinned).length;
                const isLastPinned = isPinned && index === pinnedCount - 1 && pinnedCount < paneTabs.length;
                return (
                  <React.Fragment key={tab.id}>
                    {isDragOver &&
                      activeDropZone === "center" &&
                      dragOverIndex === index && (
                        <div className="ptl-drop-indicator" />
                      )}
                    <Tab
                      tab={tab}
                      isActive={pane.activeTab === tab.id}
                      isDragging={dragData?.tabId === tab.id}
                      isPinned={isPinned}
                      onClick={() => activateTab(pane.id, tab.id)}
                      onClose={() => closeTab(pane.id, tab.id)}
                      onPin={() => pinTab(pane.id, tab.id)}
                      onUnpin={() => unpinTab(pane.id, tab.id)}
                      onDragStart={() => handleTabDragStart(tab.id)}
                      onDragEnd={handleTabDragEnd}
                    />
                    {isLastPinned && (
                      <div className="ptl-pin-separator" />
                    )}
                  </React.Fragment>
                );
              })}
              {isDragOver &&
                activeDropZone === "center" &&
                dragOverIndex === paneTabs.length && (
                  <div className="ptl-drop-indicator" />
                )}
              <div className="ptl-tab-bar-right">
                {tabBarActions && pane && tabBarActions(paneId, pane)}
                <button
                  className="ptl-maximize-btn"
                  onClick={handleMaximizeToggle}
                  title={isMaximized ? "Restore pane" : "Maximize pane"}
                  aria-label={isMaximized ? "Restore pane" : "Maximize pane"}
                >
                {isMaximized ? (
                  <svg
                    xmlns="http://www.w3.org"
                    width="24"
                    height="24"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    stroke-width="2"
                    stroke-linecap="round"
                    stroke-linejoin="round"
                  >
                    <path d="M4 14h6v6m10-6h-6v6M4 10h6V4m10 6h-6V4" />
                  </svg>
                ) : (
                  <svg
                    width="14"
                    height="14"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.3"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path d="M8 3H5a2 2 0 0 0-2 2v3m18 0V5a2 2 0 0 0-2-2h-3m0 18h3a2 2 0 0 0 2-2v-3M3 16v3a2 2 0 0 0 2 2h3" />
                  </svg>
                )}
                </button>
              </div>
            </div>
            <div className="ptl-pane-content" onClick={handleContentClick}>
              {activeTabData ? (
                activeTabData.content
              ) : (
                <div className="ptl-empty-state">No tab selected</div>
              )}
            </div>
            {/* Tab context menu (rendered via portal to avoid overflow clipping) */}
            {contextMenu &&
              contextMenuTab &&
              typeof document !== "undefined" &&
              createPortal(
                <div
                  ref={contextMenuRef}
                  className="ptl-context-menu"
                  style={{ top: contextMenu.y, left: contextMenu.x }}
                  onContextMenu={(e) => e.preventDefault()}
                  role="menu"
                >
                  <div
                    className="ptl-context-menu-item"
                    role="menuitem"
                    onClick={() => {
                      if (contextMenuTab.pinned) {
                        unpinTab(pane.id, contextMenu.tabId);
                      } else {
                        pinTab(pane.id, contextMenu.tabId);
                      }
                      setContextMenu(null);
                    }}
                  >
                    {contextMenuTab.pinned ? "Unpin Tab" : "Pin Tab"}
                  </div>
                  {contextMenuTab.closable !== false && (
                    <>
                      <div
                        className="ptl-context-menu-separator"
                        role="separator"
                      />
                      <div
                        className="ptl-context-menu-item"
                        role="menuitem"
                        onClick={() => {
                          closeTab(pane.id, contextMenu.tabId);
                          setContextMenu(null);
                        }}
                      >
                        Close Tab
                      </div>
                    </>
                  )}
                </div>,
                document.body
              )}
          </>
        )}
      </div>
    </Allotment.Pane>
  );
};
