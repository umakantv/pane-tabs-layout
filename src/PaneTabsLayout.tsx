import React, { useCallback, useEffect, useRef } from 'react';
import { Allotment } from 'allotment';
import 'allotment/dist/style.css';
import { LayoutProvider, useLayout } from './LayoutContext';
import { Pane } from './Pane';
import type { PaneTabsLayoutProps, LayoutNode, Id } from './types';

/**
 * Check whether a layout node (or any descendant) has the given ID.
 * Used by the auto-restore effect to detect when the maximized pane
 * has been removed from the tree.
 */
const containsPane = (node: LayoutNode, paneId: Id): boolean => {
  if (node.id === paneId) return true;
  if (node.children) {
    return node.children.some(child => containsPane(child, paneId));
  }
  return false;
};

/**
 * Recursively render the layout tree.
 *
 * The full tree is ALWAYS rendered regardless of maximize state.
 * Maximize/restore is handled purely via CSS (visibility + position:fixed)
 * so that every pane stays mounted, preserving scroll positions,
 * component state, and avoiding expensive re-mounts.
 */
const LayoutNodeRenderer: React.FC<{
  node: LayoutNode;
  minSize?: number;
  maxSize?: number;
}> = ({ node, minSize, maxSize }) => {
  const { updateNodeSizes } = useLayout();

  // Sync live Allotment sizes back to the layout tree (via ref, no re-render)
  const handleSizeChange = useCallback(
    (sizes: number[]) => {
      updateNodeSizes(node.id, sizes);
    },
    [updateNodeSizes, node.id]
  );

  if (node.type === 'pane') {
    return <Pane paneId={node.id} />;
  }

  // It's a split node - render children in an Allotment
  if (!node.children || node.children.length === 0) {
    return null;
  }

  // Derive a stable key from the children's IDs. When a structural change
  // swaps a child (e.g. pane wraps into a split, or a split collapses back
  // to a pane), the key changes, forcing Allotment to remount and re-read
  // the correct defaultSizes from the tree. Between structural changes the
  // key is stable, so user drag-resizing works normally.
  const structureKey = node.children.map(c => c.id).join(',');

  return (
    <Allotment
      key={structureKey}
      vertical={node.direction === 'vertical'}
      minSize={minSize}
      maxSize={maxSize}
      defaultSizes={node.sizes}
      onChange={handleSizeChange}
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
  const { rootNode, maximizedPaneId, restorePane } = useLayout();
  const layoutRef = useRef<HTMLDivElement>(null);

  // Track layout container rect and feed it into CSS custom properties
  // so the maximized pane can use position:fixed aligned to the layout
  // area, not the full viewport.
  useEffect(() => {
    if (!maximizedPaneId || !layoutRef.current) return;
    const el = layoutRef.current;

    const update = () => {
      const rect = el.getBoundingClientRect();
      el.style.setProperty('--ptl-maximize-top', `${rect.top}px`);
      el.style.setProperty('--ptl-maximize-left', `${rect.left}px`);
      el.style.setProperty('--ptl-maximize-width', `${rect.width}px`);
      el.style.setProperty('--ptl-maximize-height', `${rect.height}px`);
    };

    update();

    // Re-measure on resize or scroll so the overlay stays aligned.
    const ro = typeof ResizeObserver !== 'undefined' ? new ResizeObserver(update) : null;
    ro?.observe(el);
    window.addEventListener('scroll', update, true);

    return () => {
      ro?.disconnect();
      window.removeEventListener('scroll', update, true);
      el.style.removeProperty('--ptl-maximize-top');
      el.style.removeProperty('--ptl-maximize-left');
      el.style.removeProperty('--ptl-maximize-width');
      el.style.removeProperty('--ptl-maximize-height');
    };
  }, [maximizedPaneId]);

  // Auto-restore if the maximized pane no longer exists in the tree
  // (e.g. user closed all tabs in the maximized pane).
  useEffect(() => {
    if (maximizedPaneId && rootNode && !containsPane(rootNode, maximizedPaneId)) {
      restorePane();
    }
  }, [maximizedPaneId, rootNode, restorePane]);

  // Escape key restores from maximized state
  useEffect(() => {
    if (!maximizedPaneId) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        restorePane();
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [maximizedPaneId, restorePane]);

  if (!rootNode) {
    return <div className={`ptl-layout ${className}`} style={style}>No layout</div>;
  }

  return (
    <div
      ref={layoutRef}
      className={`ptl-layout ${className}`}
      style={style}
      data-maximized-pane={maximizedPaneId || undefined}
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
  linkInterception,
  tabBarActions,
  onBeforeCloseTab,
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
      tabBarActions={tabBarActions}
      onBeforeCloseTab={onBeforeCloseTab}
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
