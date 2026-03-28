import React from 'react';
import { Allotment } from 'allotment';
import 'allotment/dist/style.css';
import { LayoutProvider, useLayout } from './LayoutContext';
import { Pane } from './Pane';
import type { PaneTabsLayoutProps } from './types';

// Inner component that has access to context
const LayoutContent: React.FC<{
  className: string;
  style?: React.CSSProperties;
  vertical?: boolean;
  minSize?: number;
  maxSize?: number;
  defaultSizes?: number[];
}> = ({ className, style, vertical, minSize, maxSize, defaultSizes }) => {
  const { panes } = useLayout();

  return (
    <div className={`ptl-layout ${className}`} style={style}>
      <Allotment
        vertical={vertical}
        minSize={minSize}
        maxSize={maxSize}
        defaultSizes={defaultSizes}
      >
        {Array.from(panes.values()).map((pane) => (
          <Pane key={pane.id} paneId={pane.id} />
        ))}
      </Allotment>
    </div>
  );
};

export const PaneTabsLayout: React.FC<PaneTabsLayoutProps> = ({
  initialLayout,
  initialTabs,
  onLayoutChange,
  onTabsChange,
  className = '',
  style,
}) => {
  return (
    <LayoutProvider
      initialLayout={initialLayout}
      initialTabs={initialTabs}
      onLayoutChange={onLayoutChange}
      onTabsChange={onTabsChange}
    >
      <LayoutContent
        className={className}
        style={style}
        vertical={initialLayout.vertical}
        minSize={initialLayout.minSize}
        maxSize={initialLayout.maxSize}
        defaultSizes={initialLayout.defaultSizes}
      />
    </LayoutProvider>
  );
};
