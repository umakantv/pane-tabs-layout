import React, { createContext, useContext, useState, useCallback, useMemo } from 'react';
import type {
  Id,
  TabData,
  PaneConfig,
  LayoutConfig,
  DragData,
  LayoutContextValue,
} from './types';

interface LayoutProviderProps {
  children: React.ReactNode;
  initialLayout: LayoutConfig;
  initialTabs: TabData[];
  onLayoutChange?: (layout: LayoutConfig) => void;
  onTabsChange?: (tabs: TabData[]) => void;
}

const LayoutContext = createContext<LayoutContextValue | null>(null);

export const useLayout = (): LayoutContextValue => {
  const context = useContext(LayoutContext);
  if (!context) {
    throw new Error('useLayout must be used within a LayoutProvider');
  }
  return context;
};

export const LayoutProvider: React.FC<LayoutProviderProps> = ({
  children,
  initialLayout,
  initialTabs,
  onLayoutChange,
  onTabsChange,
}) => {
  const [tabsMap, setTabsMap] = useState<Map<Id, TabData>>(() => {
    const map = new Map<Id, TabData>();
    initialTabs.forEach((tab) => map.set(tab.id, tab));
    return map;
  });

  const [panesMap, setPanesMap] = useState<Map<Id, PaneConfig>>(() => {
    const map = new Map<Id, PaneConfig>();
    initialLayout.panes.forEach((pane) => map.set(pane.id, pane));
    return map;
  });

  const [dragData, setDragData] = useState<DragData | null>(null);

  const notifyChanges = useCallback(() => {
    if (onLayoutChange) {
      const layout: LayoutConfig = {
        ...initialLayout,
        panes: Array.from(panesMap.values()),
      };
      onLayoutChange(layout);
    }
    if (onTabsChange) {
      const tabs = Array.from(tabsMap.values());
      onTabsChange(tabs);
    }
  }, [panesMap, tabsMap, onLayoutChange, onTabsChange, initialLayout]);

  const moveTab = useCallback(
    (tabId: Id, fromPaneId: Id, toPaneId: Id, targetIndex?: number) => {
      setPanesMap((prev) => {
        const newMap = new Map(prev);
        const fromPane = newMap.get(fromPaneId);
        const toPane = newMap.get(toPaneId);

        if (!fromPane || !toPane) return prev;

        // Remove from source pane
        const fromTabs = fromPane.tabs.filter((id) => id !== tabId);
        const newFromPane = {
          ...fromPane,
          tabs: fromTabs,
          activeTab: fromPane.activeTab === tabId
            ? fromTabs[0] || undefined
            : fromPane.activeTab,
          // Collapse pane when empty
          visible: fromTabs.length > 0 ? fromPane.visible : false,
        };

        // Add to target pane at specified index
        // When moving within the same pane, use fromTabs (already filtered)
        // When moving to a different pane, use the original toPane.tabs
        const toTabs = fromPaneId === toPaneId
          ? [...fromTabs]
          : [...toPane.tabs];
        const insertIndex = targetIndex !== undefined ? targetIndex : toTabs.length;
        toTabs.splice(insertIndex, 0, tabId);
        const newToPane = {
          ...toPane,
          tabs: toTabs,
          activeTab: toPane.activeTab || tabId,
          // Always expand pane when a tab is added
          visible: true,
        };

        newMap.set(fromPaneId, newFromPane);
        newMap.set(toPaneId, newToPane);

        return newMap;
      });

      // Use setTimeout to ensure state is updated before notifying
      setTimeout(notifyChanges, 0);
    },
    [notifyChanges]
  );

  const activateTab = useCallback(
    (paneId: Id, tabId: Id) => {
      setPanesMap((prev) => {
        const newMap = new Map(prev);
        const pane = newMap.get(paneId);
        if (pane) {
          newMap.set(paneId, { ...pane, activeTab: tabId });
        }
        return newMap;
      });
      setTimeout(notifyChanges, 0);
    },
    [notifyChanges]
  );

  const closeTab = useCallback(
    (paneId: Id, tabId: Id) => {
      setPanesMap((prev) => {
        const newMap = new Map(prev);
        const pane = newMap.get(paneId);
        if (pane) {
          const newTabs = pane.tabs.filter((id) => id !== tabId);
          newMap.set(paneId, {
            ...pane,
            tabs: newTabs,
            activeTab: pane.activeTab === tabId
              ? newTabs[0] || undefined
              : pane.activeTab,
            // Collapse pane when empty
            visible: newTabs.length > 0 ? pane.visible : false,
          });
        }
        return newMap;
      });
      setTimeout(notifyChanges, 0);
    },
    [notifyChanges]
  );

  const addTab = useCallback(
    (paneId: Id, tab: TabData, activate = true) => {
      setTabsMap((prev) => {
        const newMap = new Map(prev);
        newMap.set(tab.id, tab);
        return newMap;
      });

      setPanesMap((prev) => {
        const newMap = new Map(prev);
        const pane = newMap.get(paneId);
        if (pane) {
          newMap.set(paneId, {
            ...pane,
            tabs: [...pane.tabs, tab.id],
            activeTab: activate ? tab.id : pane.activeTab,
          });
        }
        return newMap;
      });

      setTimeout(notifyChanges, 0);
    },
    [notifyChanges]
  );

  const removePane = useCallback(
    (paneId: Id) => {
      setPanesMap((prev) => {
        const newMap = new Map(prev);
        newMap.delete(paneId);
        return newMap;
      });
      setTimeout(notifyChanges, 0);
    },
    [notifyChanges]
  );

  const value = useMemo(
    () => ({
      tabs: tabsMap,
      panes: panesMap,
      moveTab,
      activateTab,
      closeTab,
      addTab,
      removePane,
      dragData,
      setDragData,
    }),
    [tabsMap, panesMap, moveTab, activateTab, closeTab, addTab, removePane, dragData]
  );

  return (
    <LayoutContext.Provider value={value}>
      {children}
    </LayoutContext.Provider>
  );
};
