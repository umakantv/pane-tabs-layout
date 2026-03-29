import React, { createContext, useContext, useState, useCallback, useMemo } from 'react';
import type {
  Id,
  TabData,
  PaneConfig,
  LayoutConfig,
  LayoutNode,
  SplitDirection,
  DragData,
  DropZoneInfo,
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

/**
 * Convert legacy flat panes array to tree structure
 */
const convertPanesToTree = (panes: PaneConfig[], vertical?: boolean): LayoutNode => {
  if (panes.length === 0) {
    return { id: 'root', type: 'pane', tabs: [], visible: true };
  }
  if (panes.length === 1) {
    return { type: 'pane', ...panes[0] };
  }
  // Create a split node with all panes as children
  return {
    id: 'root',
    type: 'split',
    direction: vertical ? 'vertical' : 'horizontal',
    children: panes.map(pane => ({ type: 'pane', ...pane })),
    sizes: panes.map(() => 1 / panes.length),
  };
};

/**
 * Flatten tree to pane map for easy lookup
 */
const flattenTreeToMap = (node: LayoutNode, map: Map<Id, PaneConfig> = new Map()): Map<Id, PaneConfig> => {
  if (node.type === 'pane') {
    map.set(node.id, {
      id: node.id,
      tabs: node.tabs || [],
      activeTab: node.activeTab,
      visible: node.visible,
      minSize: node.minSize,
      maxSize: node.maxSize,
      snap: node.snap,
    });
  } else if (node.children) {
    node.children.forEach(child => flattenTreeToMap(child, map));
  }
  return map;
};

/**
 * Find a node by ID in the tree
 */
const findNode = (node: LayoutNode, id: Id): LayoutNode | null => {
  if (node.id === id) return node;
  if (node.children) {
    for (const child of node.children) {
      const found = findNode(child, id);
      if (found) return found;
    }
  }
  return null;
};

/**
 * Find parent of a node by child ID
 */
const findParent = (node: LayoutNode, childId: Id): LayoutNode | null => {
  if (node.children) {
    for (const child of node.children) {
      if (child.id === childId) return node;
      const found = findParent(child, childId);
      if (found) return found;
    }
  }
  return null;
};

/**
 * Generate a unique ID
 */
let idCounter = 0;
const generateId = (prefix: string = 'node'): string => `${prefix}-${Date.now()}-${++idCounter}`;

export const LayoutProvider: React.FC<LayoutProviderProps> = ({
  children,
  initialLayout,
  initialTabs,
  onLayoutChange,
  onTabsChange,
}) => {
  // Initialize tabs map
  const [tabsMap, setTabsMap] = useState<Map<Id, TabData>>(() => {
    const map = new Map<Id, TabData>();
    initialTabs.forEach((tab) => map.set(tab.id, tab));
    return map;
  });

  // Initialize root node from either tree or legacy flat structure
  const [rootNode, setRootNode] = useState<LayoutNode>(() => {
    if (initialLayout.root) {
      return initialLayout.root;
    }
    // Convert legacy format
    const panes = initialLayout.panes || [];
    return convertPanesToTree(panes, initialLayout.vertical);
  });

  // Derive panes map from tree
  const panesMap = useMemo(() => flattenTreeToMap(rootNode), [rootNode]);

  const [dragData, setDragData] = useState<DragData | null>(null);
  const [dropZone, setDropZone] = useState<DropZoneInfo | null>(null);

  // Notify changes to parent
  const notifyChanges = useCallback(() => {
    if (onLayoutChange) {
      const layout: LayoutConfig = {
        root: rootNode,
        minSize: initialLayout.minSize,
        maxSize: initialLayout.maxSize,
      };
      onLayoutChange(layout);
    }
    if (onTabsChange) {
      const tabs = Array.from(tabsMap.values());
      onTabsChange(tabs);
    }
  }, [rootNode, tabsMap, onLayoutChange, onTabsChange, initialLayout.minSize, initialLayout.maxSize]);

  /**
   * Update a pane in the tree
   */
  const updatePaneInTree = useCallback((node: LayoutNode, paneId: Id, updater: (pane: LayoutNode) => LayoutNode): LayoutNode => {
    if (node.id === paneId && node.type === 'pane') {
      return updater(node);
    }
    if (node.children) {
      return {
        ...node,
        children: node.children.map(child => updatePaneInTree(child, paneId, updater)),
      };
    }
    return node;
  }, []);

  /**
   * Remove a node from the tree and return the updated tree
   */
  const removeNodeFromTree = useCallback((node: LayoutNode, nodeId: Id): LayoutNode | null => {
    if (node.id === nodeId) {
      return null; // Remove this node
    }
    if (node.children) {
      const newChildren = node.children
        .map(child => removeNodeFromTree(child, nodeId))
        .filter((child): child is LayoutNode => child !== null);
      
      // If only one child remains in a split, collapse it
      if (newChildren.length === 1 && node.type === 'split') {
        return newChildren[0];
      }
      
      // If no children, return null
      if (newChildren.length === 0) {
        return null;
      }
      
      // Redistribute sizes evenly
      const newSizes = newChildren.map(() => 1 / newChildren.length);
      
      return {
        ...node,
        children: newChildren,
        sizes: newSizes,
      };
    }
    return node;
  }, []);

  /**
   * Split a pane and move a tab from source to the new pane
   */
  const splitPane = useCallback((tabId: Id, sourcePaneId: Id, targetPaneId: Id, direction: SplitDirection) => {
    const isVertical = direction === 'top' || direction === 'bottom';
    const isBefore = direction === 'left' || direction === 'top';
    
    setRootNode((prevRoot) => {
      const targetNode = findNode(prevRoot, targetPaneId);
      if (!targetNode || targetNode.type !== 'pane') return prevRoot;
      
      const newPaneId = generateId('pane');
      const newPane: LayoutNode = {
        id: newPaneId,
        type: 'pane',
        tabs: [tabId],
        activeTab: tabId,
        visible: true,
        minSize: targetNode.minSize,
        maxSize: targetNode.maxSize,
      };
      
      // First, remove tab from source pane
      let newRoot = updatePaneInTree(prevRoot, sourcePaneId, (pane) => {
        const newTabs = (pane.tabs || []).filter(t => t !== tabId);
        return {
          ...pane,
          tabs: newTabs,
          activeTab: pane.activeTab === tabId ? newTabs[0] : pane.activeTab,
          visible: newTabs.length > 0,
        };
      });
      
      // Helper to insert new pane into tree at target location
      const insertNode = (node: LayoutNode): LayoutNode => {
        if (node.id === targetPaneId && node.type === 'pane') {
          // Create a new split containing the target and new pane
          const targetTabs = node.tabs || [];
          const children = isBefore 
            ? [newPane, { ...node, tabs: targetTabs }]
            : [{ ...node, tabs: targetTabs }, newPane];
          
          return {
            id: generateId('split'),
            type: 'split',
            direction: isVertical ? 'vertical' : 'horizontal',
            children,
            sizes: [0.5, 0.5],
          };
        }
        
        if (node.children) {
          // Check if target is a direct child and parent has matching direction
          const targetIndex = node.children.findIndex(child => child.id === targetPaneId);
          
          if (targetIndex !== -1 && node.direction === (isVertical ? 'vertical' : 'horizontal')) {
            // Parent has same direction - insert alongside
            const newChildren = [...node.children];
            
            const insertIndex = isBefore ? targetIndex : targetIndex + 1;
            newChildren.splice(insertIndex, 0, newPane);
            
            // Redistribute sizes
            const newSizes = newChildren.map(() => 1 / newChildren.length);
            
            return {
              ...node,
              children: newChildren,
              sizes: newSizes,
            };
          }
          
          // Recurse into children
          return {
            ...node,
            children: node.children.map(insertNode),
          };
        }
        
        return node;
      };
      
      return insertNode(newRoot);
    });
    
    setTimeout(notifyChanges, 0);
  }, [notifyChanges, updatePaneInTree]);

  const moveTab = useCallback(
    (tabId: Id, fromPaneId: Id, toPaneId: Id, targetIndex?: number) => {
      if (fromPaneId === toPaneId) {
        // Reordering within same pane - update the tree
        setRootNode((prevRoot) => {
          return updatePaneInTree(prevRoot, fromPaneId, (pane) => {
            const tabs = pane.tabs || [];
            const currentIndex = tabs.indexOf(tabId);
            if (currentIndex === -1) return pane;
            
            const newTabs = tabs.filter(t => t !== tabId);
            const insertIndex = targetIndex !== undefined 
              ? (targetIndex > currentIndex ? targetIndex - 1 : targetIndex)
              : newTabs.length;
            newTabs.splice(insertIndex, 0, tabId);
            
            return { ...pane, tabs: newTabs };
          });
        });
      } else {
        // Moving between panes
        setRootNode((prevRoot) => {
          let newRoot = updatePaneInTree(prevRoot, fromPaneId, (pane) => {
            const newTabs = (pane.tabs || []).filter(t => t !== tabId);
            return {
              ...pane,
              tabs: newTabs,
              activeTab: pane.activeTab === tabId ? newTabs[0] : pane.activeTab,
              visible: newTabs.length > 0,
            };
          });
          
          newRoot = updatePaneInTree(newRoot, toPaneId, (pane) => {
            const tabs = pane.tabs || [];
            const insertIndex = targetIndex !== undefined ? targetIndex : tabs.length;
            const newTabs = [...tabs];
            newTabs.splice(insertIndex, 0, tabId);
            return {
              ...pane,
              tabs: newTabs,
              activeTab: pane.activeTab || tabId,
              visible: true,
            };
          });
          
          return newRoot;
        });
      }

      setTimeout(notifyChanges, 0);
    },
    [notifyChanges, updatePaneInTree]
  );

  const activateTab = useCallback(
    (paneId: Id, tabId: Id) => {
      setRootNode((prevRoot) => {
        return updatePaneInTree(prevRoot, paneId, (pane) => ({
          ...pane,
          activeTab: tabId,
        }));
      });
      setTimeout(notifyChanges, 0);
    },
    [notifyChanges, updatePaneInTree]
  );

  const closeTab = useCallback(
    (paneId: Id, tabId: Id) => {
      setRootNode((prevRoot) => {
        const newRoot = updatePaneInTree(prevRoot, paneId, (pane) => {
          const newTabs = (pane.tabs || []).filter((id) => id !== tabId);
          return {
            ...pane,
            tabs: newTabs,
            activeTab: pane.activeTab === tabId ? newTabs[0] : pane.activeTab,
            visible: newTabs.length > 0,
          };
        });
        
        // Check if pane is now empty - remove it
        const pane = findNode(newRoot, paneId);
        if (pane && pane.type === 'pane' && (pane.tabs || []).length === 0) {
          return removeNodeFromTree(newRoot, paneId) || { id: 'root', type: 'pane', tabs: [] };
        }
        
        return newRoot;
      });
      setTimeout(notifyChanges, 0);
    },
    [notifyChanges, updatePaneInTree, removeNodeFromTree]
  );

  const addTab = useCallback(
    (paneId: Id, tab: TabData, activate = true) => {
      setTabsMap((prev) => {
        const newMap = new Map(prev);
        newMap.set(tab.id, tab);
        return newMap;
      });

      setRootNode((prevRoot) => {
        return updatePaneInTree(prevRoot, paneId, (pane) => ({
          ...pane,
          tabs: [...(pane.tabs || []), tab.id],
          activeTab: activate ? tab.id : pane.activeTab,
          visible: true,
        }));
      });

      setTimeout(notifyChanges, 0);
    },
    [notifyChanges, updatePaneInTree]
  );

  const removePane = useCallback(
    (paneId: Id) => {
      setRootNode((prevRoot) => {
        return removeNodeFromTree(prevRoot, paneId) || { id: 'root', type: 'pane', tabs: [] };
      });
      setTimeout(notifyChanges, 0);
    },
    [notifyChanges, removeNodeFromTree]
  );

  const value = useMemo(
    () => ({
      tabs: tabsMap,
      panes: panesMap,
      rootNode,
      moveTab,
      splitPane,
      activateTab,
      closeTab,
      addTab,
      removePane,
      dragData,
      setDragData,
      dropZone,
      setDropZone,
    }),
    [tabsMap, panesMap, rootNode, moveTab, splitPane, activateTab, closeTab, addTab, removePane, dragData, dropZone]
  );

  return (
    <LayoutContext.Provider value={value}>
      {children}
    </LayoutContext.Provider>
  );
};
