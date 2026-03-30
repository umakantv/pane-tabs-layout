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
  const { rootNode } = useLayout();

  if (!rootNode) {
    return <div className={`ptl-layout ${className}`} style={style}>No layout</div>;
  }

  return (
    <div className={`ptl-layout ${className}`} style={style}>
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
  linkInterception,
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
      linkInterception={linkInterception}
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
