import React from 'react';
import { Allotment } from 'allotment';
import 'allotment/dist/style.css';
import { LayoutProvider, useLayout } from './LayoutContext';
import { Pane } from './Pane';
import type { PaneTabsLayoutProps, LayoutNode } from './types';

/**
 * Recursively render the layout tree
 */
const LayoutNodeRenderer: React.FC<{
  node: LayoutNode;
  minSize?: number;
  maxSize?: number;
}> = ({ node, minSize, maxSize }) => {
  if (node.type === 'pane') {
    return <Pane paneId={node.id} />;
  }

  // It's a split node - render children in an Allotment
  if (!node.children || node.children.length === 0) {
    return null;
  }

  return (
    <Allotment
      vertical={node.direction === 'vertical'}
      minSize={minSize}
      maxSize={maxSize}
      defaultSizes={node.sizes}
    >
      {node.children.map((child) => (
        <Allotment.Pane key={child.id}>
          <div className="ptl-split-pane-content">
            <LayoutNodeRenderer node={child} minSize={minSize} maxSize={maxSize} />
          </div>
        </Allotment.Pane>
      ))}
    </Allotment>
  );
};

// Inner component that has access to context
const LayoutContent: React.FC<{
  className: string;
  style?: React.CSSProperties;
  minSize?: number;
  maxSize?: number;
}> = ({ className, style, minSize, maxSize }) => {
  const { rootNode, onOpenLink, tabs, panes, activateTab, addTab } = useLayout();

  const handleClickCapture = React.useCallback(async (e: React.MouseEvent) => {
    if (!onOpenLink) return;

    const target = e.target as HTMLElement;
    const anchor = target.closest('a[href]');
    if (!anchor) return;

    const href = (anchor as HTMLAnchorElement).href;
    if (!href) return;

    const tabData = await onOpenLink(href);
    if (!tabData) return; // User returned null — let default happen

    e.preventDefault();
    e.stopPropagation();

    // Check if tab exists
    if (tabs.has(tabData.id)) {
      // Find pane and activate
      for (const [paneId, pane] of panes) {
        if (pane.tabs.includes(tabData.id)) {
          activateTab(paneId, tabData.id);
          return;
        }
      }
      return;
    }

    // New tab — pick a pane
    const paneList = Array.from(panes.values());
    const targetPane = paneList.find(p => p.visible !== false) || paneList[0];
    if (targetPane) {
      addTab(targetPane.id, tabData);
    }
  }, [onOpenLink, tabs, panes, activateTab, addTab]);

  if (!rootNode) {
    return <div className={`ptl-layout ${className}`} style={style}>No layout</div>;
  }

  return (
    <div
      className={`ptl-layout ${className}`}
      style={style}
      onClickCapture={onOpenLink ? handleClickCapture : undefined}
    >
      <LayoutNodeRenderer node={rootNode} minSize={minSize} maxSize={maxSize} />
    </div>
  );
};

export const PaneTabsLayout: React.FC<PaneTabsLayoutProps> = ({
  initialLayout,
  initialTabs,
  onLayoutChange,
  onTabsChange,
  onOpenLink,
  className = '',
  style,
}) => {
  return (
    <LayoutProvider
      initialLayout={initialLayout}
      initialTabs={initialTabs}
      onLayoutChange={onLayoutChange}
      onTabsChange={onTabsChange}
      onOpenLink={onOpenLink}
    >
      <LayoutContent
        className={className}
        style={style}
        minSize={initialLayout.minSize}
        maxSize={initialLayout.maxSize}
      />
    </LayoutProvider>
  );
};
