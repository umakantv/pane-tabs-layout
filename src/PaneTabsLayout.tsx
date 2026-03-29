import React, { useCallback, useState } from 'react';
import { Allotment } from 'allotment';
import 'allotment/dist/style.css';
import { LayoutProvider, useLayout } from './LayoutContext';
import { Pane } from './Pane';
import type { PaneTabsLayoutProps, CreatePanePosition, DropZoneType } from './types';

// Drop zone configuration for the overlay
const DROP_ZONES: { type: DropZoneType; className: string }[] = [
  { type: 'top', className: 'ptl-drop-zone ptl-drop-zone-top' },
  { type: 'bottom', className: 'ptl-drop-zone ptl-drop-zone-bottom' },
  { type: 'left', className: 'ptl-drop-zone ptl-drop-zone-left' },
  { type: 'right', className: 'ptl-drop-zone ptl-drop-zone-right' },
  { type: 'top-left', className: 'ptl-drop-zone ptl-drop-zone-corner ptl-drop-zone-top-left' },
  { type: 'top-right', className: 'ptl-drop-zone ptl-drop-zone-corner ptl-drop-zone-top-right' },
  { type: 'bottom-left', className: 'ptl-drop-zone ptl-drop-zone-corner ptl-drop-zone-bottom-left' },
  { type: 'bottom-right', className: 'ptl-drop-zone ptl-drop-zone-corner ptl-drop-zone-bottom-right' },
];

// Preview labels for each zone
const PREVIEW_LABELS: Record<DropZoneType, string> = {
  top: 'Top',
  bottom: 'Bottom',
  left: 'Left',
  right: 'Right',
  'top-left': 'Top-Left',
  'top-right': 'Top-Right',
  'bottom-left': 'Bottom-Left',
  'bottom-right': 'Bottom-Right',
};

interface DropZoneOverlayProps {
  onDrop: (position: CreatePanePosition) => void;
}

const DropZoneOverlay: React.FC<DropZoneOverlayProps> = ({ onDrop }) => {
  const [hoveredZone, setHoveredZone] = useState<DropZoneType | null>(null);

  const handleDragOver = useCallback((e: React.DragEvent, zone: DropZoneType) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setHoveredZone(zone);
  }, []);

  const handleDragLeave = useCallback(() => {
    setHoveredZone(null);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent, zone: DropZoneType) => {
    e.preventDefault();
    setHoveredZone(null);
    onDrop(zone);
  }, [onDrop]);

  return (
    <div className="ptl-drop-zone-overlay">
      {DROP_ZONES.map(({ type, className }) => (
        <div
          key={type}
          className={`${className} ${hoveredZone === type ? 'ptl-drop-zone-active' : ''}`}
          onDragOver={(e) => handleDragOver(e, type)}
          onDragLeave={handleDragLeave}
          onDrop={(e) => handleDrop(e, type)}
          data-zone={type}
        >
          {hoveredZone === type && (
            <div className="ptl-drop-zone-preview">
              <span className="ptl-drop-zone-preview-icon">⊞</span>
              <span className="ptl-drop-zone-preview-text">
                Create pane ({PREVIEW_LABELS[type]})
              </span>
            </div>
          )}
        </div>
      ))}
    </div>
  );
};

// Inner component that has access to context
const LayoutContent: React.FC<{
  className: string;
  style?: React.CSSProperties;
  vertical?: boolean;
  minSize?: number;
  maxSize?: number;
  defaultSizes?: number[];
}> = ({ className, style, vertical, minSize, maxSize, defaultSizes }) => {
  const { panes, paneOrder, dragData, createPane } = useLayout();

  // Render panes in the order specified by paneOrder
  const orderedPanes = paneOrder
    .filter((id) => panes.has(id))
    .map((id) => panes.get(id)!);

  // Handler for dropping on a drop zone
  const handleZoneDrop = useCallback((position: CreatePanePosition) => {
    if (!dragData) return;
    createPane(dragData.tabId, dragData.sourcePaneId, position);
  }, [dragData, createPane]);

  return (
    <div className={`ptl-layout ${className}`} style={style}>
      <Allotment
        vertical={vertical}
        minSize={minSize}
        maxSize={maxSize}
        defaultSizes={defaultSizes}
      >
        {orderedPanes.map((pane) => (
          <Pane key={pane.id} paneId={pane.id} />
        ))}
      </Allotment>
      {dragData && <DropZoneOverlay onDrop={handleZoneDrop} />}
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
