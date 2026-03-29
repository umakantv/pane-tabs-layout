import { ReactNode } from 'react';

/**
 * Unique identifier for tabs and panes
 */
export type Id = string;

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
 * Layout configuration
 */
export interface LayoutConfig {
  /** Array of pane configurations */
  panes: PaneConfig[];
  /** Default sizes for the panes */
  defaultSizes?: number[];
  /** Whether the layout is vertical (default: horizontal) */
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
 * Position for creating a new pane via drag-and-drop
 * Edge positions create full-width/height splits
 * Corner positions create 2x2 splits at the specified corner
 */
export type CreatePanePosition =
  | 'left'
  | 'right'
  | 'top'
  | 'bottom'
  | 'top-left'
  | 'top-right'
  | 'bottom-left'
  | 'bottom-right';

/**
 * Type of drop zone in the overlay
 */
export type DropZoneType = CreatePanePosition;

/**
 * Context value for the pane-tabs-layout
 */
export interface LayoutContextValue {
  /** Map of all tabs by ID */
  tabs: Map<Id, TabData>;
  /** Map of all panes by ID */
  panes: Map<Id, PaneConfig>;
  /** Ordered list of pane IDs for rendering order */
  paneOrder: Id[];
  /** Move a tab from one pane to another */
  moveTab: (tabId: Id, fromPaneId: Id, toPaneId: Id, targetIndex?: number) => void;
  /** Activate a tab in a pane */
  activateTab: (paneId: Id, tabId: Id) => void;
  /** Close a tab */
  closeTab: (paneId: Id, tabId: Id) => void;
  /** Add a new tab to a pane */
  addTab: (paneId: Id, tab: TabData, activate?: boolean) => void;
  /** Remove a pane */
  removePane: (paneId: Id) => void;
  /** Create a new pane by splitting (drag tab to edge/intersection) */
  createPane: (tabId: Id, sourcePaneId: Id, position: CreatePanePosition) => void;
  /** Current drag data */
  dragData: DragData | null;
  /** Set drag data */
  setDragData: (data: DragData | null) => void;
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
