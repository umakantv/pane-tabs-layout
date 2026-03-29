import { ReactNode } from 'react';

/**
 * Unique identifier for tabs and panes
 */
export type Id = string;

/**
 * Direction for splitting panes
 */
export type SplitDirection = 'left' | 'right' | 'top' | 'bottom';

/**
 * Tab data structure
 */
export interface TabData {
  /** Unique identifier for the tab */
  id: Id;
  /** Display title of the tab */
  title: string;
  /** Optional icon to display before the title */
  icon?: ReactNode;
  /** Content to render when the tab is active */
  content: ReactNode;
  /** Whether the tab can be closed */
  closable?: boolean;
  /** Whether the tab can be dragged to other panes */
  draggable?: boolean;
  /** Additional data associated with the tab */
  data?: Record<string, unknown>;
}

/**
 * Pane configuration
 */
export interface PaneConfig {
  /** Unique identifier for the pane */
  id: Id;
  /** Array of tab IDs in this pane */
  tabs: Id[];
  /** Currently active tab ID */
  activeTab?: Id;
  /** Whether the pane is visible (auto-set based on tab count) */
  visible?: boolean;
  /** Minimum size of the pane in pixels */
  minSize?: number;
  /** Maximum size of the pane in pixels */
  maxSize?: number;
  /** Preferred size (e.g., "200px" or "50%") */
  preferredSize?: number | string;
  /** Whether the pane can snap to zero size */
  snap?: boolean;
}

/**
 * Layout node type - can be either a leaf pane or a split container
 */
export type LayoutNodeType = 'pane' | 'split';

/**
 * Split direction for container nodes
 */
export type SplitOrientation = 'horizontal' | 'vertical';

/**
 * A node in the layout tree - either a pane (leaf) or a split (container)
 */
export interface LayoutNode {
  /** Unique identifier for this node */
  id: Id;
  /** Type of node: 'pane' for leaf nodes, 'split' for containers */
  type: LayoutNodeType;
  /** For split nodes: orientation of the split */
  direction?: SplitOrientation;
  /** For split nodes: child nodes */
  children?: LayoutNode[];
  /** For split nodes: proportional sizes of children (sum should be 1) */
  sizes?: number[];
  /** For pane nodes: array of tab IDs */
  tabs?: Id[];
  /** For pane nodes: currently active tab ID */
  activeTab?: Id;
  /** For pane nodes: minimum size in pixels */
  minSize?: number;
  /** For pane nodes: maximum size in pixels */
  maxSize?: number;
  /** For pane nodes: whether pane is visible */
  visible?: boolean;
  /** For pane nodes: snap to zero size */
  snap?: boolean;
}

/**
 * Layout configuration - supports both flat (legacy) and tree (new) structures
 */
export interface LayoutConfig {
  /** Root node of the layout tree (new tree-based structure) */
  root?: LayoutNode;
  /** Array of pane configurations (legacy flat structure) */
  panes?: PaneConfig[];
  /** Default sizes for the panes (legacy) */
  defaultSizes?: number[];
  /** Whether the layout is vertical (default: horizontal) - legacy */
  vertical?: boolean;
  /** Minimum size for any pane */
  minSize?: number;
  /** Maximum size for any pane */
  maxSize?: number;
}

/**
 * Drag and drop data transfer
 */
export interface DragData {
  tabId: Id;
  sourcePaneId: Id;
}

/**
 * Information about the current drop zone during drag
 */
export interface DropZoneInfo {
  /** The pane being dragged over */
  paneId: Id;
  /** The drop zone direction: 'center' for adding to pane, or split direction */
  direction: SplitDirection | 'center';
}

/**
 * Context value for the pane-tabs-layout
 */
export interface LayoutContextValue {
  /** Map of all tabs by ID */
  tabs: Map<Id, TabData>;
  /** Map of all panes by ID (flat map for easy lookup) */
  panes: Map<Id, PaneConfig>;
  /** Root node of the layout tree */
  rootNode: LayoutNode | null;
  /** Move a tab from one pane to another */
  moveTab: (tabId: Id, fromPaneId: Id, toPaneId: Id, targetIndex?: number) => void;
  /** Split a pane and move a tab from source to the new pane */
  splitPane: (tabId: Id, sourcePaneId: Id, targetPaneId: Id, direction: SplitDirection) => void;
  /** Activate a tab in a pane */
  activateTab: (paneId: Id, tabId: Id) => void;
  /** Close a tab */
  closeTab: (paneId: Id, tabId: Id) => void;
  /** Add a new tab to a pane */
  addTab: (paneId: Id, tab: TabData, activate?: boolean) => void;
  /** Remove a pane (merges with sibling if possible) */
  removePane: (paneId: Id) => void;
  /** Current drag data */
  dragData: DragData | null;
  /** Set drag data */
  setDragData: (data: DragData | null) => void;
  /** Current drop zone info */
  dropZone: DropZoneInfo | null;
  /** Set drop zone info */
  setDropZone: (zone: DropZoneInfo | null) => void;
}

/**
 * Props for the PaneTabsLayout component
 */
export interface PaneTabsLayoutProps {
  /** Initial layout configuration */
  initialLayout: LayoutConfig;
  /** Initial tabs data */
  initialTabs: TabData[];
  /** Callback when layout changes */
  onLayoutChange?: (layout: LayoutConfig) => void;
  /** Callback when tabs change */
  onTabsChange?: (tabs: TabData[]) => void;
  /** Additional CSS class */
  className?: string;
  /** Inline styles */
  style?: React.CSSProperties;
}

/**
 * Props for the Tab component
 */
export interface TabProps {
  /** Tab data */
  tab: TabData;
  /** Whether the tab is active */
  isActive: boolean;
  /** Whether the tab is being dragged */
  isDragging?: boolean;
  /** Click handler */
  onClick?: () => void;
  /** Close handler */
  onClose?: () => void;
  /** Drag start handler */
  onDragStart?: () => void;
  /** Drag end handler */
  onDragEnd?: () => void;
}

/**
 * Props for the Pane component
 */
export interface PaneProps {
  /** Pane ID - component will look up pane data from context */
  paneId: Id;
  /** Additional CSS class */
  className?: string;
}
