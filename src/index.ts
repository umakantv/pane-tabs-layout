// Main component
export { PaneTabsLayout } from './PaneTabsLayout';

// Sub-components
export { Pane } from './Pane';
export { Tab } from './Tab';
export { PaneLink } from './PaneLink';

// Context and hooks
export { LayoutProvider, useLayout } from './LayoutContext';

// Types
export type {
  Id,
  SplitDirection,
  SplitOrientation,
  LayoutNodeType,
  TabData,
  PaneConfig,
  LayoutConfig,
  LayoutNode,
  DragData,
  DropZoneInfo,
  LayoutContextValue,
  LinkInterceptionMode,
  PaneTabsLayoutProps,
  TabProps,
  PaneProps,
  PaneLinkProps,
} from './types';

// Styles
import './styles.css';

// Re-export allotment types for convenience
export { Allotment } from 'allotment';
export type { AllotmentHandle } from 'allotment';