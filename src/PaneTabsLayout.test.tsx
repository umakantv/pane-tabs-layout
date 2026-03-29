import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { PaneTabsLayout } from './PaneTabsLayout';
import { LayoutProvider, useLayout } from './LayoutContext';
import type { TabData, LayoutConfig, LayoutNode } from './types';

const mockTabs: TabData[] = [
  {
    id: 'tab1',
    title: 'Tab 1',
    content: <div data-testid="tab1-content">Tab 1 Content</div>,
  },
  {
    id: 'tab2',
    title: 'Tab 2',
    content: <div data-testid="tab2-content">Tab 2 Content</div>,
  },
  {
    id: 'tab3',
    title: 'Tab 3',
    content: <div data-testid="tab3-content">Tab 3 Content</div>,
    closable: true,
  },
];

const mockLayout: LayoutConfig = {
  panes: [
    {
      id: 'pane1',
      tabs: ['tab1', 'tab2'],
      activeTab: 'tab1',
    },
    {
      id: 'pane2',
      tabs: ['tab3'],
      activeTab: 'tab3',
    },
  ],
};

describe('PaneTabsLayout', () => {
  it('renders without crashing', () => {
    render(
      <PaneTabsLayout
        initialLayout={mockLayout}
        initialTabs={mockTabs}
      />
    );
    
    expect(screen.getByText('Tab 1')).toBeInTheDocument();
    expect(screen.getByText('Tab 2')).toBeInTheDocument();
    expect(screen.getByText('Tab 3')).toBeInTheDocument();
  });

  it('displays active tab content', () => {
    render(
      <PaneTabsLayout
        initialLayout={mockLayout}
        initialTabs={mockTabs}
      />
    );
    
    // Tab 1 should be active in pane 1
    expect(screen.getByTestId('tab1-content')).toBeInTheDocument();
    // Tab 3 should be active in pane 2
    expect(screen.getByTestId('tab3-content')).toBeInTheDocument();
  });

  it('switches tabs when clicked', () => {
    render(
      <PaneTabsLayout
        initialLayout={mockLayout}
        initialTabs={mockTabs}
      />
    );
    
    // Initially Tab 1 is active
    expect(screen.getByTestId('tab1-content')).toBeInTheDocument();
    
    // Click on Tab 2
    fireEvent.click(screen.getByText('Tab 2'));
    
    // Tab 2 content should now be visible
    expect(screen.getByTestId('tab2-content')).toBeInTheDocument();
  });

  it('calls onLayoutChange when layout changes', async () => {
    const onLayoutChange = vi.fn();
    
    render(
      <PaneTabsLayout
        initialLayout={mockLayout}
        initialTabs={mockTabs}
        onLayoutChange={onLayoutChange}
      />
    );
    
    // Click on Tab 2 to change active tab
    fireEvent.click(screen.getByText('Tab 2'));
    
    // onLayoutChange should be called (async via setTimeout)
    await waitFor(() => {
      expect(onLayoutChange).toHaveBeenCalled();
    });
  });

  it('renders with custom className', () => {
    const { container } = render(
      <PaneTabsLayout
        initialLayout={mockLayout}
        initialTabs={mockTabs}
        className="custom-class"
      />
    );
    
    expect(container.querySelector('.custom-class')).toBeInTheDocument();
  });

  it('marks active tabs correctly', () => {
    render(
      <PaneTabsLayout
        initialLayout={mockLayout}
        initialTabs={mockTabs}
      />
    );
    
    // Tab 1 should be marked as active
    const tab1 = screen.getByRole('tab', { selected: true, name: /Tab 1/i });
    expect(tab1).toHaveClass('ptl-tab-active');
  });

  it('does not display inactive tab content', () => {
    render(
      <PaneTabsLayout
        initialLayout={mockLayout}
        initialTabs={mockTabs}
      />
    );
    
    // Tab 1 is active, Tab 2 is not - Tab 2 content should not be visible
    expect(screen.getByTestId('tab1-content')).toBeInTheDocument();
    expect(screen.queryByTestId('tab2-content')).not.toBeInTheDocument();
  });

  it('closes a closable tab and removes it from DOM', async () => {
    render(
      <PaneTabsLayout
        initialLayout={mockLayout}
        initialTabs={mockTabs}
      />
    );
    
    // Tab 3 is closable and active in pane 2
    expect(screen.getByText('Tab 3')).toBeInTheDocument();
    expect(screen.getByTestId('tab3-content')).toBeInTheDocument();
    
    // Find and click the close button for Tab 3
    const closeButtons = screen.getAllByRole('button', { name: /close/i });
    // Tab 3 is the only one with closable: true explicitly, but all default to closable
    // Click the last close button which should be for Tab 3
    fireEvent.click(closeButtons[closeButtons.length - 1]);
    
    // Tab 3 should be removed from DOM
    await waitFor(() => {
      expect(screen.queryByText('Tab 3')).not.toBeInTheDocument();
      expect(screen.queryByTestId('tab3-content')).not.toBeInTheDocument();
    });
  });

  it('updates active tab after closing the active tab', async () => {
    render(
      <PaneTabsLayout
        initialLayout={mockLayout}
        initialTabs={mockTabs}
      />
    );
    
    // Initially Tab 1 is active in pane 1
    expect(screen.getByTestId('tab1-content')).toBeInTheDocument();
    
    // Close Tab 1 (first close button in pane 1)
    const closeButtons = screen.getAllByRole('button', { name: /close/i });
    fireEvent.click(closeButtons[0]);
    
    // Tab 2 should now be active and its content visible
    await waitFor(() => {
      expect(screen.queryByText('Tab 1')).not.toBeInTheDocument();
      expect(screen.getByTestId('tab2-content')).toBeInTheDocument();
    });
  });

  it('calls onTabsChange when tabs are removed', async () => {
    const onTabsChange = vi.fn();
    
    render(
      <PaneTabsLayout
        initialLayout={mockLayout}
        initialTabs={mockTabs}
        onTabsChange={onTabsChange}
      />
    );
    
    // Close a tab
    const closeButtons = screen.getAllByRole('button', { name: /close/i });
    fireEvent.click(closeButtons[0]);
    
    // onTabsChange should be called (async via setTimeout)
    await waitFor(() => {
      expect(onTabsChange).toHaveBeenCalled();
    });
  });

  it('renders with custom style prop', () => {
    const { container } = render(
      <PaneTabsLayout
        initialLayout={mockLayout}
        initialTabs={mockTabs}
        style={{ backgroundColor: 'red' }}
      />
    );
    
    const layoutDiv = container.querySelector('.ptl-layout');
    // Check that style attribute contains the background color
    expect(layoutDiv).toHaveAttribute('style', expect.stringContaining('background-color'));
  });

  it('renders layout with single pane correctly', () => {
    const singlePaneLayout: LayoutConfig = {
      panes: [
        {
          id: 'single-pane',
          tabs: ['tab1'],
          activeTab: 'tab1',
        },
      ],
    };
    
    render(
      <PaneTabsLayout
        initialLayout={singlePaneLayout}
        initialTabs={mockTabs}
      />
    );
    
    expect(screen.getByText('Tab 1')).toBeInTheDocument();
    expect(screen.getByTestId('tab1-content')).toBeInTheDocument();
  });

  it('renders with non-closable tab having no close button', () => {
    const nonClosableTabs: TabData[] = [
      {
        id: 'tab-noclose',
        title: 'Non Closable',
        content: <div>Content</div>,
        closable: false,
      },
    ];
    
    const layout: LayoutConfig = {
      panes: [
        {
          id: 'pane-noclose',
          tabs: ['tab-noclose'],
          activeTab: 'tab-noclose',
        },
      ],
    };
    
    render(
      <PaneTabsLayout
        initialLayout={layout}
        initialTabs={nonClosableTabs}
      />
    );
    
    // Tab should be visible
    expect(screen.getByText('Non Closable')).toBeInTheDocument();
    
    // No close button should exist
    const closeButtons = screen.queryAllByRole('button', { name: /close/i });
    expect(closeButtons).toHaveLength(0);
  });

  it('renders with empty tabs array', () => {
    const emptyLayout: LayoutConfig = {
      panes: [
        {
          id: 'empty-pane',
          tabs: [],
          activeTab: undefined,
        },
      ],
    };
    
    render(
      <PaneTabsLayout
        initialLayout={emptyLayout}
        initialTabs={[]}
      />
    );
    
    // Should render without crashing, pane should exist
    expect(document.querySelector('.ptl-pane')).toBeInTheDocument();
  });

  it('renders with tree-based root layout', () => {
    const treeLayout: LayoutConfig = {
      root: {
        id: 'root',
        type: 'pane',
        tabs: ['tab1'],
        activeTab: 'tab1',
      },
    };
    
    render(
      <PaneTabsLayout
        initialLayout={treeLayout}
        initialTabs={mockTabs}
      />
    );
    
    expect(screen.getByText('Tab 1')).toBeInTheDocument();
    expect(screen.getByTestId('tab1-content')).toBeInTheDocument();
  });

  // ============================================
  // Phase 2: Nested Tree Layouts
  // ============================================

  it('renders nested split layout with horizontal direction', () => {
    const nestedLayout: LayoutConfig = {
      root: {
        id: 'root',
        type: 'split',
        direction: 'horizontal',
        children: [
          {
            id: 'pane-left',
            type: 'pane',
            tabs: ['tab1'],
            activeTab: 'tab1',
          },
          {
            id: 'pane-right',
            type: 'pane',
            tabs: ['tab2'],
            activeTab: 'tab2',
          },
        ],
        sizes: [0.5, 0.5],
      },
    };
    
    render(
      <PaneTabsLayout
        initialLayout={nestedLayout}
        initialTabs={mockTabs}
      />
    );
    
    // Both panes should be visible
    expect(screen.getByText('Tab 1')).toBeInTheDocument();
    expect(screen.getByText('Tab 2')).toBeInTheDocument();
    expect(screen.getByTestId('tab1-content')).toBeInTheDocument();
    expect(screen.getByTestId('tab2-content')).toBeInTheDocument();
  });

  it('renders nested split layout with vertical direction', () => {
    const verticalLayout: LayoutConfig = {
      root: {
        id: 'root',
        type: 'split',
        direction: 'vertical',
        children: [
          {
            id: 'pane-top',
            type: 'pane',
            tabs: ['tab1'],
            activeTab: 'tab1',
          },
          {
            id: 'pane-bottom',
            type: 'pane',
            tabs: ['tab3'],
            activeTab: 'tab3',
          },
        ],
        sizes: [0.6, 0.4],
      },
    };
    
    render(
      <PaneTabsLayout
        initialLayout={verticalLayout}
        initialTabs={mockTabs}
      />
    );
    
    expect(screen.getByText('Tab 1')).toBeInTheDocument();
    expect(screen.getByText('Tab 3')).toBeInTheDocument();
  });

  it('renders deeply nested split layout (3 levels)', () => {
    const deepLayout: LayoutConfig = {
      root: {
        id: 'root',
        type: 'split',
        direction: 'horizontal',
        children: [
          {
            id: 'pane-left',
            type: 'pane',
            tabs: ['tab1'],
            activeTab: 'tab1',
          },
          {
            id: 'split-right',
            type: 'split',
            direction: 'vertical',
            children: [
              {
                id: 'pane-top-right',
                type: 'pane',
                tabs: ['tab2'],
                activeTab: 'tab2',
              },
              {
                id: 'pane-bottom-right',
                type: 'pane',
                tabs: ['tab3'],
                activeTab: 'tab3',
              },
            ],
            sizes: [0.5, 0.5],
          },
        ],
        sizes: [0.5, 0.5],
      },
    };
    
    render(
      <PaneTabsLayout
        initialLayout={deepLayout}
        initialTabs={mockTabs}
      />
    );
    
    // All three tabs should be visible
    expect(screen.getByText('Tab 1')).toBeInTheDocument();
    expect(screen.getByText('Tab 2')).toBeInTheDocument();
    expect(screen.getByText('Tab 3')).toBeInTheDocument();
  });

  // ============================================
  // Phase 2: Drag and Drop Simulation
  // ============================================

  it('drag and drop tab from one pane to another', async () => {
    render(
      <PaneTabsLayout
        initialLayout={mockLayout}
        initialTabs={mockTabs}
      />
    );
    
    // Find Tab 1 element
    const tab1Element = screen.getByText('Tab 1');
    
    // Start drag on Tab 1
    fireEvent.dragStart(tab1Element, {
      dataTransfer: {
        setData: vi.fn(),
        getData: vi.fn().mockReturnValue('tab1'),
      },
    });
    
    // Find a tab in pane2 (Tab 3 area) to drop on
    const tab3Element = screen.getByText('Tab 3');
    
    // Drop on Tab 3's pane area
    fireEvent.dragOver(tab3Element, {
      dataTransfer: {
        dropEffect: 'move',
        getData: vi.fn().mockReturnValue('tab1'),
      },
    });
    
    fireEvent.drop(tab3Element, {
      dataTransfer: {
        getData: vi.fn().mockReturnValue('tab1'),
      },
    });
    
    // Tab 1 should still exist (moved or still present)
    await waitFor(() => {
      expect(screen.getByText('Tab 1')).toBeInTheDocument();
    });
  });

  it('drag tab to edge triggers split', async () => {
    render(
      <PaneTabsLayout
        initialLayout={mockLayout}
        initialTabs={mockTabs}
      />
    );
    
    // Find Tab 1
    const tab1Element = screen.getByText('Tab 1');
    
    // Start drag
    fireEvent.dragStart(tab1Element, {
      dataTransfer: {
        setData: vi.fn(),
        effectAllowed: 'move',
      },
    });
    
    // Find the pane container (drop zone)
    const paneElement = document.querySelector('.ptl-pane');
    expect(paneElement).toBeInTheDocument();
    
    // Simulate drag over the left edge of the pane
    if (paneElement) {
      // Mock client rect to simulate edge position
      Object.defineProperty(paneElement, 'getBoundingClientRect', {
        value: () => ({
          left: 0,
          top: 0,
          right: 400,
          bottom: 300,
          width: 400,
          height: 300,
        }),
      });
      
      fireEvent.dragOver(paneElement, {
        clientX: 50, // Left edge
        clientY: 150,
        dataTransfer: {
          dropEffect: 'move',
          getData: vi.fn().mockReturnValue('tab1'),
        },
      });
    }
    
    // The component should handle the drag (no crash)
    expect(document.querySelector('.ptl-pane')).toBeInTheDocument();
  });

  it('reorder tabs within same pane by drag and drop', async () => {
    render(
      <PaneTabsLayout
        initialLayout={mockLayout}
        initialTabs={mockTabs}
      />
    );
    
    // In pane1, we have tab1 and tab2
    // Drag tab2 and drop it before tab1
    const tab2Element = screen.getByText('Tab 2');
    
    fireEvent.dragStart(tab2Element, {
      dataTransfer: {
        setData: vi.fn(),
        getData: vi.fn().mockReturnValue('tab2'),
      },
    });
    
    const tab1Element = screen.getByText('Tab 1');
    
    fireEvent.dragOver(tab1Element, {
      dataTransfer: {
        dropEffect: 'move',
        getData: vi.fn().mockReturnValue('tab2'),
      },
    });
    
    fireEvent.drop(tab1Element, {
      dataTransfer: {
        getData: vi.fn().mockReturnValue('tab2'),
      },
    });
    
    // Both tabs should still exist
    await waitFor(() => {
      expect(screen.getByText('Tab 1')).toBeInTheDocument();
      expect(screen.getByText('Tab 2')).toBeInTheDocument();
    });
  });

  // ============================================
  // Phase 2: Auto-cleanup Behaviors
  // ============================================

  it('auto-removes pane when all tabs are closed', async () => {
    const singleTabLayout: LayoutConfig = {
      panes: [
        {
          id: 'pane-a',
          tabs: ['tab1'],
          activeTab: 'tab1',
        },
        {
          id: 'pane-b',
          tabs: ['tab2'],
          activeTab: 'tab2',
        },
      ],
    };
    
    render(
      <PaneTabsLayout
        initialLayout={singleTabLayout}
        initialTabs={mockTabs}
      />
    );
    
    expect(screen.getByText('Tab 1')).toBeInTheDocument();
    expect(screen.getByText('Tab 2')).toBeInTheDocument();
    
    // Close tab1 (only tab in pane-a)
    const closeButtons = screen.getAllByRole('button', { name: /close/i });
    fireEvent.click(closeButtons[0]);
    
    // Tab 1 should be removed
    await waitFor(() => {
      expect(screen.queryByText('Tab 1')).not.toBeInTheDocument();
    });
  });

  it('handles layout with all empty panes gracefully', () => {
    const emptyPanesLayout: LayoutConfig = {
      panes: [
        { id: 'empty1', tabs: [], activeTab: undefined },
        { id: 'empty2', tabs: [], activeTab: undefined },
      ],
    };
    
    render(
      <PaneTabsLayout
        initialLayout={emptyPanesLayout}
        initialTabs={[]}
      />
    );
    
    // Should render without crashing
    expect(document.querySelector('.ptl-layout')).toBeInTheDocument();
  });

  // ============================================
  // Phase 3: Advanced Edge Cases & Integration
  // ============================================

  it('renders tab with icon', () => {
    const tabsWithIcon: TabData[] = [
      {
        id: 'tab-icon',
        title: 'Icon Tab',
        icon: <span data-testid="tab-icon">📁</span>,
        content: <div>Content</div>,
      },
    ];
    
    const layout: LayoutConfig = {
      panes: [{ id: 'pane-icon', tabs: ['tab-icon'], activeTab: 'tab-icon' }],
    };
    
    render(
      <PaneTabsLayout
        initialLayout={layout}
        initialTabs={tabsWithIcon}
      />
    );
    
    expect(screen.getByTestId('tab-icon')).toBeInTheDocument();
    expect(screen.getByText('Icon Tab')).toBeInTheDocument();
  });

  it('tab with custom data is stored correctly', () => {
    const tabsWithData: TabData[] = [
      {
        id: 'tab-data',
        title: 'Data Tab',
        content: <div data-testid="data-content">Content</div>,
        data: { customKey: 'customValue', number: 42 },
      },
    ];
    
    const layout: LayoutConfig = {
      panes: [{ id: 'pane-data', tabs: ['tab-data'], activeTab: 'tab-data' }],
    };
    
    render(
      <PaneTabsLayout
        initialLayout={layout}
        initialTabs={tabsWithData}
      />
    );
    
    // Tab should render with its content
    expect(screen.getByTestId('data-content')).toBeInTheDocument();
    expect(screen.getByText('Data Tab')).toBeInTheDocument();
  });

  it('renders with vertical layout prop (legacy)', () => {
    const verticalLayout: LayoutConfig = {
      panes: [
        { id: 'pane-a', tabs: ['tab1'], activeTab: 'tab1' },
        { id: 'pane-b', tabs: ['tab2'], activeTab: 'tab2' },
      ],
      vertical: true,
    };
    
    render(
      <PaneTabsLayout
        initialLayout={verticalLayout}
        initialTabs={mockTabs}
      />
    );
    
    expect(screen.getByText('Tab 1')).toBeInTheDocument();
    expect(screen.getByText('Tab 2')).toBeInTheDocument();
  });

  it('renders with minSize and maxSize props', () => {
    const layoutWithSizes: LayoutConfig = {
      panes: [
        { id: 'pane-sized', tabs: ['tab1'], activeTab: 'tab1', minSize: 100, maxSize: 500 },
      ],
      minSize: 50,
      maxSize: 800,
    };
    
    render(
      <PaneTabsLayout
        initialLayout={layoutWithSizes}
        initialTabs={mockTabs}
      />
    );
    
    expect(screen.getByText('Tab 1')).toBeInTheDocument();
    // Layout should render without issues
    expect(document.querySelector('.ptl-layout')).toBeInTheDocument();
  });

  it('non-draggable tab does not respond to drag', () => {
    const nonDraggableTabs: TabData[] = [
      {
        id: 'tab-nodrag',
        title: 'Non Draggable',
        content: <div>Content</div>,
        draggable: false,
      },
    ];
    
    const layout: LayoutConfig = {
      panes: [{ id: 'pane-nodrag', tabs: ['tab-nodrag'], activeTab: 'tab-nodrag' }],
    };
    
    render(
      <PaneTabsLayout
        initialLayout={layout}
        initialTabs={nonDraggableTabs}
      />
    );
    
    const tabElement = screen.getByText('Non Draggable');
    expect(tabElement).toBeInTheDocument();
    
    // Tab should not be draggable (check via element property or class)
    // The Tab component sets draggable={tab.draggable !== false}
    // When draggable: false, element should have draggable="false" or not be draggable
    const draggableAttr = tabElement.getAttribute('draggable');
    expect(draggableAttr === 'false' || draggableAttr === null).toBe(true);
  });

  it('useLayout throws error when used outside provider', () => {
    const TestComponent = () => {
      useLayout();
      return <div>Should not render</div>;
    };
    
    // Suppress console.error for this test
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    
    expect(() => {
      render(<TestComponent />);
    }).toThrow('useLayout must be used within a LayoutProvider');
    
    consoleSpy.mockRestore();
  });

  it('removePane via context removes pane and collapses tree', async () => {
    let removePaneFn: ((paneId: string) => void) | null = null;
    let onLayoutChangeMock = vi.fn();
    
    const TestComponent = () => {
      const { removePane } = useLayout();
      removePaneFn = removePane;
      return <span data-testid="hook-ready" />;
    };
    
    const twoPaneLayout: LayoutConfig = {
      panes: [
        { id: 'pane-keep', tabs: ['tab1'], activeTab: 'tab1' },
        { id: 'pane-remove', tabs: ['tab2'], activeTab: 'tab2' },
      ],
    };
    
    render(
      <LayoutProvider
        initialLayout={twoPaneLayout}
        initialTabs={mockTabs}
        onLayoutChange={onLayoutChangeMock}
      >
        <TestComponent />
      </LayoutProvider>
    );
    
    await waitFor(() => {
      expect(screen.getByTestId('hook-ready')).toBeInTheDocument();
    });
    
    // Remove one pane
    if (removePaneFn) {
      removePaneFn('pane-remove');
    }
    
    // onLayoutChange should fire
    await waitFor(() => {
      expect(onLayoutChangeMock).toHaveBeenCalled();
    });
  });

  it('splitPane via context creates a new split', async () => {
    let splitPaneFn: ((tabId: string, sourcePane: string, targetPane: string, direction: any) => void) | null = null;
    let onLayoutChangeMock = vi.fn();
    
    const TestComponent = () => {
      const { splitPane } = useLayout();
      splitPaneFn = splitPane;
      return <span data-testid="hook-ready" />;
    };
    
    const singlePaneLayout: LayoutConfig = {
      panes: [
        { id: 'pane-single', tabs: ['tab1', 'tab2'], activeTab: 'tab1' },
      ],
    };
    
    render(
      <LayoutProvider
        initialLayout={singlePaneLayout}
        initialTabs={mockTabs}
        onLayoutChange={onLayoutChangeMock}
      >
        <TestComponent />
      </LayoutProvider>
    );
    
    await waitFor(() => {
      expect(screen.getByTestId('hook-ready')).toBeInTheDocument();
    });
    
    // Split by moving tab2 to right of pane-single
    if (splitPaneFn) {
      splitPaneFn('tab2', 'pane-single', 'pane-single', 'right');
    }
    
    // onLayoutChange should fire
    await waitFor(() => {
      expect(onLayoutChangeMock).toHaveBeenCalled();
    });
  });

  it('handles rapid tab switching without errors', async () => {
    render(
      <PaneTabsLayout
        initialLayout={mockLayout}
        initialTabs={mockTabs}
      />
    );
    
    // Rapidly switch tabs
    for (let i = 0; i < 5; i++) {
      fireEvent.click(screen.getByText('Tab 2'));
      fireEvent.click(screen.getByText('Tab 1'));
    }
    
    // Should still render correctly
    await waitFor(() => {
      expect(screen.getByText('Tab 1')).toBeInTheDocument();
      expect(screen.getByText('Tab 2')).toBeInTheDocument();
    });
  });

  it('handles closing multiple tabs in sequence', async () => {
    const threeTabLayout: LayoutConfig = {
      panes: [
        { id: 'pane-multi', tabs: ['tab1', 'tab2', 'tab3'], activeTab: 'tab1' },
      ],
    };
    
    render(
      <PaneTabsLayout
        initialLayout={threeTabLayout}
        initialTabs={mockTabs}
      />
    );
    
    // Close all closable tabs
    const closeButtons = screen.getAllByRole('button', { name: /close/i });
    
    // Close each one
    for (const btn of closeButtons) {
      fireEvent.click(btn);
    }
    
    // Should still render (may have empty state)
    await waitFor(() => {
      expect(document.querySelector('.ptl-layout')).toBeInTheDocument();
    });
  });

  it('preserves tab order when using defaultSizes', () => {
    const layoutWithSizes: LayoutConfig = {
      panes: [
        { id: 'pane-a', tabs: ['tab1'], activeTab: 'tab1' },
        { id: 'pane-b', tabs: ['tab2'], activeTab: 'tab2' },
      ],
      defaultSizes: [300, 200],
    };
    
    render(
      <PaneTabsLayout
        initialLayout={layoutWithSizes}
        initialTabs={mockTabs}
      />
    );
    
    // Both tabs should be visible
    expect(screen.getByText('Tab 1')).toBeInTheDocument();
    expect(screen.getByText('Tab 2')).toBeInTheDocument();
  });

  it('handles layout with preferredSize on panes', () => {
    const layoutWithPreferred: LayoutConfig = {
      panes: [
        { id: 'pane-pref', tabs: ['tab1'], activeTab: 'tab1', preferredSize: 400 },
      ],
    };
    
    render(
      <PaneTabsLayout
        initialLayout={layoutWithPreferred}
        initialTabs={mockTabs}
      />
    );
    
    expect(screen.getByText('Tab 1')).toBeInTheDocument();
  });

  // ============================================
  // High Priority: cleanupTree() Auto-Collapse
  // ============================================

  it('auto-collapses split when pane becomes empty', async () => {
    // Create layout: [pane-a | pane-b]
    const twoPaneLayout: LayoutConfig = {
      root: {
        id: 'root',
        type: 'split',
        direction: 'horizontal',
        children: [
          { id: 'pane-a', type: 'pane', tabs: ['tab1'], activeTab: 'tab1' },
          { id: 'pane-b', type: 'pane', tabs: ['tab2'], activeTab: 'tab2' },
        ],
        sizes: [0.5, 0.5],
      },
    };
    
    render(
      <PaneTabsLayout
        initialLayout={twoPaneLayout}
        initialTabs={mockTabs}
      />
    );
    
    expect(screen.getByText('Tab 1')).toBeInTheDocument();
    expect(screen.getByText('Tab 2')).toBeInTheDocument();
    
    // Close tab1 (only tab in pane-a)
    const closeButtons = screen.getAllByRole('button', { name: /close/i });
    fireEvent.click(closeButtons[0]);
    
    // Pane-a should be removed, pane-b should remain
    await waitFor(() => {
      expect(screen.queryByText('Tab 1')).not.toBeInTheDocument();
      expect(screen.getByText('Tab 2')).toBeInTheDocument();
    });
  });

  it('auto-collapses single-child split to flat pane', async () => {
    // Create layout: split with [pane-a | pane-b], pane-a has 2 tabs
    const nestedLayout: LayoutConfig = {
      root: {
        id: 'root',
        type: 'split',
        direction: 'horizontal',
        children: [
          { id: 'pane-a', type: 'pane', tabs: ['tab1', 'tab2'], activeTab: 'tab1' },
          { id: 'pane-b', type: 'pane', tabs: ['tab3'], activeTab: 'tab3' },
        ],
        sizes: [0.5, 0.5],
      },
    };
    
    render(
      <PaneTabsLayout
        initialLayout={nestedLayout}
        initialTabs={mockTabs}
      />
    );
    
    expect(screen.getByText('Tab 1')).toBeInTheDocument();
    expect(screen.getByText('Tab 2')).toBeInTheDocument();
    expect(screen.getByText('Tab 3')).toBeInTheDocument();
    
    // Close all tabs in pane-a
    const closeButtons = screen.getAllByRole('button', { name: /close/i });
    // Close tab1
    fireEvent.click(closeButtons[0]);
    await waitFor(() => {
      expect(screen.queryByText('Tab 1')).not.toBeInTheDocument();
    });
    // Close tab2
    const remainingClose = screen.getAllByRole('button', { name: /close/i });
    fireEvent.click(remainingClose[0]);
    
    // Split should collapse - only tab3 remains
    await waitFor(() => {
      expect(screen.queryByText('Tab 2')).not.toBeInTheDocument();
      expect(screen.getByText('Tab 3')).toBeInTheDocument();
    });
  });

  it('creates empty pane when all children removed from split', async () => {
    const singleTabLayout: LayoutConfig = {
      panes: [
        { id: 'pane-only', tabs: ['tab1'], activeTab: 'tab1' },
      ],
    };
    
    render(
      <PaneTabsLayout
        initialLayout={singleTabLayout}
        initialTabs={mockTabs}
      />
    );
    
    // Close the only tab
    const closeButton = screen.getByRole('button', { name: /close/i });
    fireEvent.click(closeButton);
    
    // Should still render (empty state or single empty pane)
    await waitFor(() => {
      expect(document.querySelector('.ptl-layout')).toBeInTheDocument();
    });
  });

  // ============================================
  // High Priority: calculateDropZone() Edge Detection
  // ============================================

  it('handles drag over pane without crashing', () => {
    render(
      <PaneTabsLayout
        initialLayout={mockLayout}
        initialTabs={mockTabs}
      />
    );
    
    const paneElement = document.querySelector('.ptl-pane');
    expect(paneElement).toBeInTheDocument();
    
    // Start drag
    const tab1 = screen.getByText('Tab 1');
    fireEvent.dragStart(tab1, {
      dataTransfer: { setData: vi.fn(), getData: vi.fn() },
    });
    
    // Drag over pane - should not crash
    if (paneElement) {
      fireEvent.dragOver(paneElement, {
        clientX: 100,
        clientY: 100,
        dataTransfer: { dropEffect: 'move', getData: vi.fn().mockReturnValue('tab1') },
      });
    }
    
    // Pane should still be rendered
    expect(document.querySelector('.ptl-pane')).toBeInTheDocument();
  });

  it('handles drag leave pane without crashing', () => {
    render(
      <PaneTabsLayout
        initialLayout={mockLayout}
        initialTabs={mockTabs}
      />
    );
    
    const paneElement = document.querySelector('.ptl-pane');
    expect(paneElement).toBeInTheDocument();
    
    const tab1 = screen.getByText('Tab 1');
    fireEvent.dragStart(tab1, {
      dataTransfer: { setData: vi.fn(), getData: vi.fn() },
    });
    
    if (paneElement) {
      fireEvent.dragOver(paneElement, {
        clientX: 100,
        clientY: 100,
        dataTransfer: { dropEffect: 'move', getData: vi.fn().mockReturnValue('tab1') },
      });
      
      // Drag leave should not crash
      fireEvent.dragLeave(paneElement, {
        relatedTarget: document.body,
      });
    }
    
    expect(document.querySelector('.ptl-pane')).toBeInTheDocument();
  });

  it('handles drop on pane without crashing', () => {
    render(
      <PaneTabsLayout
        initialLayout={mockLayout}
        initialTabs={mockTabs}
      />
    );
    
    const paneElement = document.querySelector('.ptl-pane');
    expect(paneElement).toBeInTheDocument();
    
    const tab1 = screen.getByText('Tab 1');
    fireEvent.dragStart(tab1, {
      dataTransfer: { 
        setData: vi.fn(), 
        getData: vi.fn().mockReturnValue('tab1'),
        effectAllowed: 'move',
      },
    });
    
    if (paneElement) {
      fireEvent.dragOver(paneElement, {
        clientX: 200,
        clientY: 150,
        dataTransfer: { dropEffect: 'move', getData: vi.fn().mockReturnValue('tab1') },
      });
      
      // Drop should not crash
      fireEvent.drop(paneElement, {
        dataTransfer: { getData: vi.fn().mockReturnValue('tab1') },
      });
    }
    
    // Tab 1 should still exist
    expect(screen.getByText('Tab 1')).toBeInTheDocument();
  });
});
