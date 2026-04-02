import { ReactNode } from 'react';

/**
 * Props passed to a custom tab render function (TabData.renderTab).
 * The outer tab wrapper (drag handlers, click, ARIA attributes) is always
 * managed by the library — renderTab only controls the *inner* content.
 */
export interface RenderTabProps {
  /** The full tab data object */
  tab: TabData;
  /** Whether this tab is the active (selected) tab in its pane */
  isActive: boolean;
  /** Whether this tab is currently pinned */
  isPinned: boolean;
  /** Whether this tab is currently being dragged */
  isDragging: boolean;
  /** The default inner content (icon + title + tabExtra + pin/close buttons) for composition */
  defaultTab: ReactNode;
}

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
  /** Whether the tab is pinned (pinned tabs are grouped at the start of the tab bar and cannot be closed via UI) */
  pinned?: boolean;
  /** Additional data associated with the tab */
  data?: Record<string, unknown>;
  /**
   * Extra content rendered inside the tab header, after the title and before
   * the pin/close buttons. Ideal for badges, status dots, or small action buttons.
   */
  tabExtra?: ReactNode;
  /**
   * Custom render function for the tab header's inner content.
   * Receives the current state and the default inner content (`defaultTab`)
   * for easy composition (wrap, decorate, or fully replace).
   *
   * The outer interactive wrapper (drag, click, ARIA) is always library-managed,
   * so drag-and-drop and pinning remain intact.
   *
   * @example
   * ```tsx
   * renderTab: ({ defaultTab, isActive }) => (
   *   <div style={{ display: 'flex', flexDirection: 'column' }}>
   *     {defaultTab}
   *     {isActive && <span className="tab-subtitle">editing</span>}
   *   </div>
   * )
   * ```
   */
  renderTab?: (props: RenderTabProps) => ReactNode;
  /**
   * Callback invoked before the tab is closed. Return `false` or a Promise
   * that resolves to `false` to prevent the tab from closing. Useful for
   * dirty-state confirmation dialogs.
   *
   * Called before the global `onBeforeCloseTab` (if provided). If this callback
   * returns/prevents close, the global callback is not invoked.
   *
   * @example
   * ```tsx
   * {
   *   id: 'editor',
   *   title: 'main.js',
   *   content: <Editor />,
   *   onBeforeClose: async () => {
   *     if (hasUnsavedChanges) {
   *       const confirmed = await showConfirmDialog('Save changes?');
   *       return confirmed; // false = prevent close
   *     }
   *     return true;
   *   },
   * }
   * ```
   */
  onBeforeClose?: () => boolean | Promise<boolean>;
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
 * Link interception mode for the layout
 * - 'auto': Automatically intercept <a> clicks inside pane content and resolve via onOpenLink
 * - 'manual': Only intercept links via the <PaneLink> component; no automatic delegation
 * - 'none': No link interception at all
 */
export type LinkInterceptionMode = 'auto' | 'manual' | 'none';

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
  /**
   * Open a link as a tab. Calls the user-provided onOpenLink resolver.
   * If the resolver returns a TabData, the tab is added (or activated if it already exists).
   * Returns the resolved TabData, or null if the link was not handled.
   */
  openLink: (url: string, paneId?: Id) => TabData | null;
  /** Link interception mode */
  linkInterception: LinkInterceptionMode;
  /** Current drag data */
  dragData: DragData | null;
  /** Set drag data */
  setDragData: (data: DragData | null) => void;
  /** Current drop zone info */
  dropZone: DropZoneInfo | null;
  /** Set drop zone info */
  setDropZone: (zone: DropZoneInfo | null) => void;
  /** Update sizes of a split node (used internally by Allotment onChange) */
  updateNodeSizes: (nodeId: Id, sizes: number[]) => void;
  /** The currently maximized pane ID, or null if no pane is maximized */
  maximizedPaneId: Id | null;
  /** Maximize a pane to fill the entire layout */
  maximizePane: (paneId: Id) => void;
  /** Restore the layout from maximized state */
  restorePane: () => void;
  /** Pin a tab (moves it to the end of the pinned group in the pane) */
  pinTab: (paneId: Id, tabId: Id) => void;
  /** Unpin a tab (moves it to the start of the unpinned group in the pane) */
  unpinTab: (paneId: Id, tabId: Id) => void;
  /**
   * Optional callback to render extra toolbar actions in a pane's tab bar
   * (to the right of the tabs, before the maximize button).
   */
  tabBarActions?: (paneId: Id, pane: PaneConfig) => ReactNode;
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
  /**
   * Link resolver callback. Called when a link is clicked inside pane content
   * (in 'auto' mode) or when openLink() is called programmatically.
   *
   * Return a TabData to open/activate a tab for the URL, or null to let
   * the default browser behavior proceed.
   *
   * @example
   * ```tsx
   * onOpenLink={(url) => {
   *   const match = url.match(/\/problem\/(\w+)$/);
   *   if (match) {
   *     return {
   *       id: `problem-${match[1]}`,
   *       title: `Problem ${match[1]}`,
   *       content: <ProblemView id={match[1]} />,
   *       data: { problemId: match[1] },
   *     };
   *   }
   *   return null;
   * }}
   * ```
   */
  onOpenLink?: (url: string) => TabData | null;
  /**
   * Controls how links inside pane content are intercepted.
   * - 'auto' (default): Automatically intercept <a> clicks and resolve via onOpenLink
   * - 'manual': Only the <PaneLink> component and openLink() calls trigger resolution
   * - 'none': No link interception at all
   */
  linkInterception?: LinkInterceptionMode;
  /**
   * Render extra toolbar actions in a pane's tab bar, to the right of the tabs
   * and to the left of the maximize button. Called once per visible pane.
   *
   * @example
   * ```tsx
   * tabBarActions={(paneId, pane) =>
   *   paneId === 'editor-pane'
   *     ? <button onClick={runCode}>▶ Run</button>
   *     : null
   * }
   * ```
   */
  tabBarActions?: (paneId: Id, pane: PaneConfig) => ReactNode;
  /**
   * Global callback invoked before any tab is closed. Return `false` or a
   * Promise that resolves to `false` to prevent the tab from closing.
   *
   * This is called after the tab-level `onBeforeClose` (if provided) only if
   * the tab-level callback allows the close. Use this for consistent app-wide
   * confirmation dialogs.
   *
   * @example
   * ```tsx
   * <PaneTabsLayout
   *   onBeforeCloseTab={async (tabId, paneId, tab) => {
   *     if (tab.data?.isDirty) {
   *       return await showConfirmDialog(`Save ${tab.title}?`);
   *     }
   *     return true;
   *   }}
   * />
   * ```
   */
  onBeforeCloseTab?: (tabId: Id, paneId: Id, tab: TabData) => boolean | Promise<boolean>;
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
  /** Whether the tab is pinned */
  isPinned?: boolean;
  /** Click handler */
  onClick?: () => void;
  /** Close handler */
  onClose?: () => void;
  /** Pin handler (called when pin button is clicked on an unpinned tab) */
  onPin?: () => void;
  /** Unpin handler (called when pin button is clicked on a pinned tab) */
  onUnpin?: () => void;
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

/**
 * Props for the PaneLink component
 */
export interface PaneLinkProps extends React.AnchorHTMLAttributes<HTMLAnchorElement> {
  /** The URL to resolve as a tab */
  href: string;
  /** Target pane to open the tab in. If omitted, uses the first available pane. */
  paneId?: Id;
  /** Content of the link */
  children: React.ReactNode;
}
