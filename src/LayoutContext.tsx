import React, { createContext, useContext, useState, useCallback, useMemo, useRef } from 'react';
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
  LinkInterceptionMode,
} from './types';

interface LayoutProviderProps {
  children: React.ReactNode;
  initialLayout: LayoutConfig;
  initialTabs: TabData[];
  onLayoutChange?: (layout: LayoutConfig) => void;
  onTabsChange?: (tabs: TabData[]) => void;
  onOpenLink?: (url: string) => TabData | null;
  linkInterception?: LinkInterceptionMode;
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
const convertPanesToTree = (panes: PaneConfig[], vertical?: boolean, defaultSizes?: number[]): LayoutNode => {
  if (panes.length === 0) {
    return { id: 'root', type: 'pane', tabs: [], visible: true };
  }
  if (panes.length === 1) {
    return { type: 'pane', ...panes[0] };
  }
  // Convert defaultSizes to proportional, or distribute evenly
  let sizes: number[];
  if (defaultSizes && defaultSizes.length === panes.length) {
    const total = defaultSizes.reduce((sum, s) => sum + s, 0);
    sizes = total > 0 ? defaultSizes.map(s => s / total) : panes.map(() => 1 / panes.length);
  } else {
    sizes = panes.map(() => 1 / panes.length);
  }
  return {
    id: 'root',
    type: 'split',
    direction: vertical ? 'vertical' : 'horizontal',
    children: panes.map(pane => ({ type: 'pane', ...pane })),
    sizes,
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

/**
 * Find the first pane node in the tree (depth-first)
 */
const findFirstPane = (node: LayoutNode): LayoutNode | null => {
  if (node.type === 'pane') return node;
  if (node.children) {
    for (const child of node.children) {
      const found = findFirstPane(child);
      if (found) return found;
    }
  }
  return null;
};

/**
 * Check whether a layout node (or any of its descendants) has the given ID
 */
const containsPane = (node: LayoutNode, paneId: Id): boolean => {
  if (node.id === paneId) return true;
  if (node.children) {
    return node.children.some(child => containsPane(child, paneId));
  }
  return false;
};

/**
 * Walk the tree and write liveSizesRef entries into node.sizes so
 * the tree has accurate proportions (used before maximize to snapshot
 * current sizes for later restore).
 */
const commitLiveSizesToTree = (node: LayoutNode, sizesMap: Map<Id, number[]>): LayoutNode => {
  if (node.type === 'pane' || !node.children) return node;

  const liveSizes = sizesMap.get(node.id);
  const newSizes = (liveSizes && liveSizes.length === node.children.length)
    ? liveSizes
    : node.sizes;

  return {
    ...node,
    sizes: newSizes,
    children: node.children.map(child => commitLiveSizesToTree(child, sizesMap)),
  };
};

/**
 * Find which pane contains a given tab ID
 */
const findPaneContainingTab = (node: LayoutNode, tabId: Id): LayoutNode | null => {
  if (node.type === 'pane' && node.tabs?.includes(tabId)) {
    return node;
  }
  if (node.children) {
    for (const child of node.children) {
      const found = findPaneContainingTab(child, tabId);
      if (found) return found;
    }
  }
  return null;
};

export const LayoutProvider: React.FC<LayoutProviderProps> = ({
  children,
  initialLayout,
  initialTabs,
  onLayoutChange,
  onTabsChange,
  onOpenLink: onOpenLinkProp,
  linkInterception: linkInterceptionProp = 'auto',
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
    return convertPanesToTree(panes, initialLayout.vertical, initialLayout.defaultSizes);
  });

  // Derive panes map from tree
  const panesMap = useMemo(() => flattenTreeToMap(rootNode), [rootNode]);

  const [dragData, setDragData] = useState<DragData | null>(null);
  const [dropZone, setDropZone] = useState<DropZoneInfo | null>(null);
  const [maximizedPaneId, setMaximizedPaneId] = useState<Id | null>(null);

  // Ref to track live Allotment sizes without triggering re-renders.
  // Structural operations read from this ref to get accurate current sizes.
  const liveSizesRef = useRef<Map<Id, number[]>>(new Map());

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
   * Update sizes of a split node. Stores in ref (no re-render) so that
   * structural operations always read accurate, user-dragged sizes.
   */
  const updateNodeSizes = useCallback(
    (nodeId: Id, sizes: number[]) => {
      const total = sizes.reduce((sum, s) => sum + s, 0);
      const proportional = total > 0 ? sizes.map(s => s / total) : sizes;
      liveSizesRef.current.set(nodeId, proportional);
    },
    []
  );

  /**
   * Maximize a pane.  The entire layout tree stays mounted (CSS handles
   * visibility), so there is no need to commit sizes — Allotment
   * instances keep running and liveSizesRef stays accurate.
   */
  const maximizePane = useCallback((paneId: Id) => {
    setMaximizedPaneId(paneId);
  }, []);

  /**
   * Restore the layout from maximized state.
   */
  const restorePane = useCallback(() => {
    setMaximizedPaneId(null);
  }, []);

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
      // Get current sizes (prefer live Allotment sizes from ref)
      const liveSizes = liveSizesRef.current.get(node.id);
      const oldSizes = (liveSizes && liveSizes.length === node.children.length)
        ? liveSizes
        : node.sizes || node.children.map(() => 1 / node.children!.length);

      const results = node.children.map(child => removeNodeFromTree(child, nodeId));

      // Build new children and surviving sizes together
      const newChildren: LayoutNode[] = [];
      const survivingSizes: number[] = [];
      for (let i = 0; i < results.length; i++) {
        if (results[i] !== null) {
          newChildren.push(results[i]!);
          survivingSizes.push(oldSizes[i] || 0);
        }
      }
      
      // If only one child remains in a split, collapse it
      if (newChildren.length === 1 && node.type === 'split') {
        return newChildren[0];
      }
      
      // If no children, return null
      if (newChildren.length === 0) {
        return null;
      }
      
      // Normalize surviving sizes proportionally (freed space is redistributed)
      const total = survivingSizes.reduce((sum, s) => sum + s, 0);
      const newSizes = total > 0
        ? survivingSizes.map(s => s / total)
        : survivingSizes.map(() => 1 / survivingSizes.length);
      
      return {
        ...node,
        children: newChildren,
        sizes: newSizes,
      };
    }
    return node;
  }, []);

  /**
   * Clean up the tree by removing empty panes and collapsing single-child splits
   */
  const cleanupTree = useCallback((node: LayoutNode): LayoutNode => {
    // If it's a pane, check if it has tabs
    if (node.type === 'pane') {
      const tabCount = node.tabs?.length || 0;
      if (tabCount === 0) {
        // Return a special marker that this node should be removed
        // We'll handle this at the parent level
        return { ...node, _empty: true } as LayoutNode;
      }
      return node;
    }

    // It's a split node - process children
    if (node.children) {
      // Get current sizes before filtering (prefer live Allotment sizes)
      const liveSizes = liveSizesRef.current.get(node.id);
      const oldSizes = (liveSizes && liveSizes.length === node.children.length)
        ? liveSizes
        : node.sizes || node.children.map(() => 1 / node.children!.length);

      // Recursively clean up children, tracking survivors and their sizes
      const cleaned = node.children.map(child => cleanupTree(child));
      const newChildren: LayoutNode[] = [];
      const survivingSizes: number[] = [];

      for (let i = 0; i < cleaned.length; i++) {
        const isEmptyPane = cleaned[i].type === 'pane' && (cleaned[i].tabs?.length || 0) === 0;
        if (!isEmptyPane) {
          newChildren.push(cleaned[i]);
          survivingSizes.push(oldSizes[i] || 0);
        }
      }

      // If no children remain, create a single empty pane
      if (newChildren.length === 0) {
        return {
          id: generateId('pane'),
          type: 'pane',
          tabs: [],
          visible: true,
        };
      }

      // If only one child remains, collapse this split
      if (newChildren.length === 1) {
        return newChildren[0];
      }

      // Normalize surviving sizes proportionally
      const total = survivingSizes.reduce((sum, s) => sum + s, 0);
      const newSizes = total > 0
        ? survivingSizes.map(s => s / total)
        : survivingSizes.map(() => 1 / survivingSizes.length);

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
            // Get current sizes (prefer live Allotment sizes)
            const liveSizes = liveSizesRef.current.get(node.id);
            const currentSizes = (liveSizes && liveSizes.length === node.children.length)
              ? [...liveSizes]
              : node.sizes ? [...node.sizes] : node.children.map(() => 1 / node.children!.length);

            const newChildren = [...node.children];
            const newSizes = [...currentSizes];

            // New pane takes half of the target's space
            const targetSize = newSizes[targetIndex];
            newSizes[targetIndex] = targetSize / 2;

            const insertIndex = isBefore ? targetIndex : targetIndex + 1;
            newChildren.splice(insertIndex, 0, newPane);
            newSizes.splice(insertIndex, 0, targetSize / 2);
            
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
      
      const result = insertNode(newRoot);
      // Clean up empty panes and collapse single-child splits
      return cleanupTree(result);
    });
    
    setTimeout(notifyChanges, 0);
  }, [notifyChanges, updatePaneInTree, cleanupTree]);

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
          
          // Clean up empty panes and collapse single-child splits
          return cleanupTree(newRoot);
        });
      }

      setTimeout(notifyChanges, 0);
    },
    [notifyChanges, updatePaneInTree, cleanupTree]
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

  /**
   * Open a link as a tab. Delegates to the user-provided onOpenLink resolver.
   * If the resolver returns a TabData, the tab is added to the given pane
   * (or activated if it already exists). Returns the resolved TabData or null.
   */
  const openLink = useCallback(
    (url: string, paneId?: Id): TabData | null => {
      if (!onOpenLinkProp) return null;

      const resolved = onOpenLinkProp(url);
      if (!resolved) return null;

      // Check if a tab with this ID is currently open in the layout tree.
      // We check the tree (not tabsMap) because closeTab removes the tab
      // from panes but leaves stale entries in tabsMap.
      const existingPane = findPaneContainingTab(rootNode, resolved.id);
      if (existingPane) {
        activateTab(existingPane.id, resolved.id);
        return resolved;
      }

      // Determine the target pane: explicit paneId > first available pane
      let targetPaneId = paneId;
      if (!targetPaneId) {
        const firstPane = findFirstPane(rootNode);
        targetPaneId = firstPane?.id;
      }
      if (!targetPaneId) return null;

      addTab(targetPaneId, resolved, true);
      return resolved;
    },
    [onOpenLinkProp, rootNode, activateTab, addTab]
  );

  const linkInterception = linkInterceptionProp;

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
      openLink,
      linkInterception,
      dragData,
      setDragData,
      dropZone,
      setDropZone,
      updateNodeSizes,
      maximizedPaneId,
      maximizePane,
      restorePane,
    }),
    [tabsMap, panesMap, rootNode, moveTab, splitPane, activateTab, closeTab, addTab, removePane, openLink, linkInterception, dragData, dropZone, updateNodeSizes, maximizedPaneId, maximizePane, restorePane]
  );

  return (
    <LayoutContext.Provider value={value}>
      {children}
    </LayoutContext.Provider>
  );
};
