import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { PaneTabsLayout } from './PaneTabsLayout';
import { PaneLink } from './PaneLink';
import { LayoutProvider, useLayout } from './LayoutContext';
import type { TabData, LayoutConfig } from './types';

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

  it('dragging over the tab bar header does not activate split zones', async () => {
    render(
      <PaneTabsLayout
        initialLayout={mockLayout}
        initialTabs={mockTabs}
      />
    );

    const tab2Element = screen.getByText('Tab 2');
    const paneElement = document.querySelector('.ptl-pane')!;
    const tabBarElement = document.querySelector('.ptl-tab-bar')!;

    // Mock pane rect: full pane is 400×300
    Object.defineProperty(paneElement, 'getBoundingClientRect', {
      value: () => ({
        left: 0, top: 0, right: 400, bottom: 300,
        width: 400, height: 300, x: 0, y: 0, toJSON: () => {},
      }),
      configurable: true,
    });

    // Mock tab bar rect: tab bar occupies top 35px of the pane
    Object.defineProperty(tabBarElement, 'getBoundingClientRect', {
      value: () => ({
        left: 0, top: 0, right: 400, bottom: 35,
        width: 400, height: 35, x: 0, y: 0, toJSON: () => {},
      }),
      configurable: true,
    });

    // Start drag on Tab 2
    fireEvent.dragStart(tab2Element, {
      dataTransfer: {
        setData: vi.fn(),
        effectAllowed: 'move',
      },
    });

    // Drag over the LEFT EDGE of the TAB BAR (clientY=20 is within tab bar, clientX=5 is left edge)
    // Without the fix this would trigger "Split Left"; with the fix it stays "center" (reorder only).
    fireEvent.dragOver(paneElement, {
      clientX: 5,
      clientY: 20,
      dataTransfer: {
        dropEffect: 'move',
        getData: vi.fn().mockReturnValue('tab2'),
      },
    });

    // Verify the drag handler fired (drag-over styling applied)
    await waitFor(() => {
      expect(paneElement).toHaveClass('ptl-pane-drag-over');
    });

    // Should NOT show any split zone overlay because we're within the tab bar
    expect(document.querySelector('.ptl-drop-zone-overlay')).not.toBeInTheDocument();
    // Pane should NOT have split-preview class (confirms center zone, not edge zone)
    expect(paneElement).not.toHaveClass('ptl-pane-split-preview');
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
    let removePaneFn: (paneId: string) => void = () => {};
    const onLayoutChangeMock = vi.fn();
    
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
    removePaneFn('pane-remove');
    
    // onLayoutChange should fire
    await waitFor(() => {
      expect(onLayoutChangeMock).toHaveBeenCalled();
    });
  });

  it('splitPane via context creates a new split', async () => {
    let splitPaneFn: (tabId: string, sourcePane: string, targetPane: string, direction: any) => void = () => {};
    const onLayoutChangeMock = vi.fn();
    
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
    splitPaneFn('tab2', 'pane-single', 'pane-single', 'right');
    
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

  // ============================================
  // Link Interception
  // ============================================

  it('intercepts <a> clicks and opens a tab when onOpenLink returns TabData', async () => {
    const onOpenLink = vi.fn((url: string): TabData | null => {
      const match = url.match(/\/problem\/(\w+)/);
      if (match) {
        return {
          id: `problem-${match[1]}`,
          title: `Problem ${match[1]}`,
          content: <div data-testid={`problem-${match[1]}-content`}>Problem {match[1]}</div>,
        };
      }
      return null;
    });

    const tabsWithLink: TabData[] = [
      {
        id: 'tab-links',
        title: 'Links Tab',
        content: (
          <div>
            <a href="https://example.com/problem/42">Open Problem 42</a>
          </div>
        ),
      },
    ];
    const layout: LayoutConfig = {
      panes: [{ id: 'pane-link', tabs: ['tab-links'], activeTab: 'tab-links' }],
    };

    render(
      <PaneTabsLayout
        initialLayout={layout}
        initialTabs={tabsWithLink}
        onOpenLink={onOpenLink}
      />
    );

    // Click the link
    fireEvent.click(screen.getByText('Open Problem 42'));

    // onOpenLink should have been called with the href
    expect(onOpenLink).toHaveBeenCalledWith('https://example.com/problem/42');

    // The new tab should appear (tab title + content both contain "Problem 42")
    await waitFor(() => {
      expect(screen.getAllByText('Problem 42')).toHaveLength(2); // tab title + content
      expect(screen.getByTestId('problem-42-content')).toBeInTheDocument();
    });
  });

  it('does not intercept links when onOpenLink returns null', () => {
    const onOpenLink = vi.fn(() => null);

    const tabsWithExtLink: TabData[] = [
      {
        id: 'tab-ext',
        title: 'External',
        content: (
          <div>
            <a href="https://google.com">Google</a>
          </div>
        ),
      },
    ];
    const layout: LayoutConfig = {
      panes: [{ id: 'pane-ext', tabs: ['tab-ext'], activeTab: 'tab-ext' }],
    };

    render(
      <PaneTabsLayout
        initialLayout={layout}
        initialTabs={tabsWithExtLink}
        onOpenLink={onOpenLink}
      />
    );

    fireEvent.click(screen.getByText('Google'));

    expect(onOpenLink).toHaveBeenCalledWith('https://google.com/');
    // No new tab should be created
    expect(screen.queryByText('Google Tab')).not.toBeInTheDocument();
  });

  it('skips links with data-ptl-external attribute', () => {
    const onOpenLink = vi.fn(() => ({
      id: 'should-not-open',
      title: 'Should Not Open',
      content: <div>Should not appear</div>,
    }));

    const tabsWithExternal: TabData[] = [
      {
        id: 'tab-skip',
        title: 'Skip',
        content: (
          <div>
            <a href="https://example.com/problem/1" data-ptl-external>External Link</a>
          </div>
        ),
      },
    ];
    const layout: LayoutConfig = {
      panes: [{ id: 'pane-skip', tabs: ['tab-skip'], activeTab: 'tab-skip' }],
    };

    render(
      <PaneTabsLayout
        initialLayout={layout}
        initialTabs={tabsWithExternal}
        onOpenLink={onOpenLink}
      />
    );

    fireEvent.click(screen.getByText('External Link'));

    // onOpenLink should NOT have been called
    expect(onOpenLink).not.toHaveBeenCalled();
  });

  it('does not intercept links when linkInterception is "none"', () => {
    const onOpenLink = vi.fn(() => ({
      id: 'should-not-open',
      title: 'No',
      content: <div>No</div>,
    }));

    const tabsNone: TabData[] = [
      {
        id: 'tab-none',
        title: 'None Mode',
        content: (
          <div>
            <a href="https://example.com/problem/5">Problem 5</a>
          </div>
        ),
      },
    ];
    const layout: LayoutConfig = {
      panes: [{ id: 'pane-none', tabs: ['tab-none'], activeTab: 'tab-none' }],
    };

    render(
      <PaneTabsLayout
        initialLayout={layout}
        initialTabs={tabsNone}
        onOpenLink={onOpenLink}
        linkInterception="none"
      />
    );

    fireEvent.click(screen.getByText('Problem 5'));

    expect(onOpenLink).not.toHaveBeenCalled();
  });

  it('activates existing tab instead of creating duplicate when same ID returned', async () => {
    const onOpenLink = vi.fn((): TabData | null => ({
      id: 'tab1',
      title: 'Tab 1',
      content: <div data-testid="tab1-content">Tab 1 Content</div>,
    }));

    const tabsWithLink: TabData[] = [
      ...mockTabs,
      {
        id: 'tab-with-link',
        title: 'Linker',
        content: (
          <div>
            <a href="https://example.com/reopen-tab1">Reopen Tab 1</a>
          </div>
        ),
      },
    ];
    const layout: LayoutConfig = {
      panes: [
        { id: 'pane-a', tabs: ['tab1', 'tab-with-link'], activeTab: 'tab-with-link' },
        { id: 'pane-b', tabs: ['tab2'], activeTab: 'tab2' },
      ],
    };

    render(
      <PaneTabsLayout
        initialLayout={layout}
        initialTabs={tabsWithLink}
        onOpenLink={onOpenLink}
      />
    );

    // Tab 1 exists but is not active (tab-with-link is active in pane-a)
    // Click the link that resolves to tab1's ID
    fireEvent.click(screen.getByText('Reopen Tab 1'));

    expect(onOpenLink).toHaveBeenCalled();

    // Tab 1 should now be the active content (activated, not duplicated)
    await waitFor(() => {
      expect(screen.getByTestId('tab1-content')).toBeInTheDocument();
    });
  });

  it('openLink from useLayout works programmatically', async () => {
    const TestComponent = () => {
      const { openLink } = useLayout();
      return <button data-testid="open-btn" onClick={() => openLink('https://example.com/problem/99', 'pane-prog')}>Open</button>;
    };

    const onOpenLink = vi.fn((url: string): TabData | null => {
      const match = url.match(/\/problem\/(\w+)/);
      if (match) {
        return {
          id: `problem-${match[1]}`,
          title: `Problem ${match[1]}`,
          content: <div data-testid={`problem-${match[1]}-content`}>Problem {match[1]}</div>,
        };
      }
      return null;
    });

    const layout: LayoutConfig = {
      panes: [{ id: 'pane-prog', tabs: ['tab1'], activeTab: 'tab1' }],
    };

    render(
      <LayoutProvider
        initialLayout={layout}
        initialTabs={mockTabs}
        onOpenLink={onOpenLink}
      >
        <TestComponent />
      </LayoutProvider>
    );

    // Use the programmatic openLink
    fireEvent.click(screen.getByTestId('open-btn'));

    await waitFor(() => {
      expect(onOpenLink).toHaveBeenCalledWith('https://example.com/problem/99');
    });
  });

  it('re-opens a tab after it was closed (no stale tabsMap entry)', async () => {
    const onOpenLink = vi.fn((url: string): TabData | null => {
      const match = url.match(/\/problem\/(\w+)/);
      if (match) {
        return {
          id: `problem-${match[1]}`,
          title: `Problem ${match[1]}`,
          content: <div data-testid={`problem-${match[1]}-content`}>Problem {match[1]}</div>,
          closable: true,
        };
      }
      return null;
    });

    const tabsWithLink: TabData[] = [
      {
        id: 'tab-links',
        title: 'Links Tab',
        closable: false,
        content: (
          <div>
            <a href="https://example.com/problem/50">Open Problem 50</a>
          </div>
        ),
      },
    ];
    const layout: LayoutConfig = {
      panes: [{ id: 'pane-reopen', tabs: ['tab-links'], activeTab: 'tab-links' }],
    };

    render(
      <PaneTabsLayout
        initialLayout={layout}
        initialTabs={tabsWithLink}
        onOpenLink={onOpenLink}
      />
    );

    // 1. Click the link to open the tab
    fireEvent.click(screen.getByText('Open Problem 50'));
    await waitFor(() => {
      expect(screen.getByTestId('problem-50-content')).toBeInTheDocument();
    });

    // 2. Close the newly opened tab
    const closeBtn = screen.getByRole('button', { name: /Close Problem 50/i });
    fireEvent.click(closeBtn);
    await waitFor(() => {
      expect(screen.queryByTestId('problem-50-content')).not.toBeInTheDocument();
    });

    // 3. Click the link again - tab should re-open
    fireEvent.click(screen.getByText('Open Problem 50'));
    await waitFor(() => {
      expect(screen.getByTestId('problem-50-content')).toBeInTheDocument();
    });
  });

  it('delegation handler skips when PaneLink already handled the click', async () => {
    let openLinkCallCount = 0;

    const onOpenLink = vi.fn((url: string): TabData | null => {
      openLinkCallCount++;
      const match = url.match(/\/problem\/(\w+)/);
      if (match) {
        return {
          id: `problem-${match[1]}`,
          title: `Problem ${match[1]}`,
          content: <div data-testid={`problem-${match[1]}-content`}>Problem {match[1]}</div>,
        };
      }
      return null;
    });

    // PaneLink is inside tab content — it renders an <a> which the delegation
    // handler would also catch. But since PaneLink calls preventDefault first,
    // the delegation handler should skip it.
    const PaneLinkContent = () => {
      // Import PaneLink dynamically to use it inside content
      const { openLink: ctxOpenLink } = useLayout();
      return (
        <div>
          <a
            href="https://example.com/problem/77"
            onClick={(e) => {
              const resolved = ctxOpenLink('https://example.com/problem/77', 'pane-plink');
              if (resolved) e.preventDefault();
            }}
          >
            PaneLink Problem 77
          </a>
        </div>
      );
    };

    const tabsWithPaneLink: TabData[] = [
      {
        id: 'tab-plink',
        title: 'PaneLink Tab',
        content: <PaneLinkContent />,
      },
    ];
    const layout: LayoutConfig = {
      panes: [{ id: 'pane-plink', tabs: ['tab-plink'], activeTab: 'tab-plink' }],
    };

    render(
      <PaneTabsLayout
        initialLayout={layout}
        initialTabs={tabsWithPaneLink}
        onOpenLink={onOpenLink}
      />
    );

    fireEvent.click(screen.getByText('PaneLink Problem 77'));

    // onOpenLink should have been called exactly once (by the PaneLink handler),
    // NOT twice (delegation handler should have skipped)
    expect(onOpenLink).toHaveBeenCalledTimes(1);

    await waitFor(() => {
      expect(screen.getByTestId('problem-77-content')).toBeInTheDocument();
    });
  });

  // ============================================
  // Link Interception: openLink fallback paths
  // ============================================

  it('openLink falls back to first pane when no paneId is provided', async () => {
    const TestComponent = () => {
      const { openLink } = useLayout();
      // Call openLink WITHOUT a paneId — should use findFirstPane fallback
      return <button data-testid="open-no-pane" onClick={() => openLink('https://example.com/problem/55')}>Open</button>;
    };

    const onOpenLink = vi.fn((url: string): TabData | null => {
      const match = url.match(/\/problem\/(\w+)/);
      if (match) {
        return {
          id: `problem-${match[1]}`,
          title: `Problem ${match[1]}`,
          content: <div data-testid={`problem-${match[1]}-content`}>Problem {match[1]}</div>,
        };
      }
      return null;
    });

    const layout: LayoutConfig = {
      panes: [
        { id: 'first-pane', tabs: ['tab1'], activeTab: 'tab1' },
        { id: 'second-pane', tabs: ['tab2'], activeTab: 'tab2' },
      ],
    };

    render(
      <LayoutProvider initialLayout={layout} initialTabs={mockTabs} onOpenLink={onOpenLink}>
        <TestComponent />
      </LayoutProvider>
    );

    fireEvent.click(screen.getByTestId('open-no-pane'));

    await waitFor(() => {
      expect(onOpenLink).toHaveBeenCalledWith('https://example.com/problem/55');
    });
  });

  it('openLink returns null when no onOpenLink callback is provided', () => {
    let result: TabData | null = null;

    const TestComponent = () => {
      const { openLink } = useLayout();
      return (
        <button data-testid="open-no-handler" onClick={() => { result = openLink('https://example.com/problem/1'); }}>
          Open
        </button>
      );
    };

    const layout: LayoutConfig = {
      panes: [{ id: 'pane-x', tabs: ['tab1'], activeTab: 'tab1' }],
    };

    // NO onOpenLink prop
    render(
      <LayoutProvider initialLayout={layout} initialTabs={mockTabs}>
        <TestComponent />
      </LayoutProvider>
    );

    fireEvent.click(screen.getByTestId('open-no-handler'));
    expect(result).toBeNull();
  });

  // ============================================
  // Link Interception: Pane delegation edge cases
  // ============================================

  it('delegation walks up from nested element inside <a> to find the link', async () => {
    const onOpenLink = vi.fn((url: string): TabData | null => {
      const match = url.match(/\/problem\/(\w+)/);
      if (match) {
        return {
          id: `problem-${match[1]}`,
          title: `Problem ${match[1]}`,
          content: <div data-testid={`problem-${match[1]}-content`}>Content</div>,
        };
      }
      return null;
    });

    const tabsNested: TabData[] = [
      {
        id: 'tab-nested',
        title: 'Nested',
        content: (
          <div>
            <a href="https://example.com/problem/88">
              <span><strong data-testid="nested-click-target">Click me</strong></span>
            </a>
          </div>
        ),
      },
    ];
    const layout: LayoutConfig = {
      panes: [{ id: 'pane-nested', tabs: ['tab-nested'], activeTab: 'tab-nested' }],
    };

    render(
      <PaneTabsLayout
        initialLayout={layout}
        initialTabs={tabsNested}
        onOpenLink={onOpenLink}
      />
    );

    // Click the deeply nested <strong>, delegation should walk up to <a>
    fireEvent.click(screen.getByTestId('nested-click-target'));

    expect(onOpenLink).toHaveBeenCalledWith('https://example.com/problem/88');

    await waitFor(() => {
      expect(screen.getByTestId('problem-88-content')).toBeInTheDocument();
    });
  });

  it('delegation ignores <a> elements without an href attribute', () => {
    const onOpenLink = vi.fn(() => ({
      id: 'should-not-open',
      title: 'Nope',
      content: <div>Nope</div>,
    }));

    const tabsNoHref: TabData[] = [
      {
        id: 'tab-nohref',
        title: 'No Href',
        content: (
          <div>
            <a data-testid="anchor-no-href">Anchor without href</a>
          </div>
        ),
      },
    ];
    const layout: LayoutConfig = {
      panes: [{ id: 'pane-nohref', tabs: ['tab-nohref'], activeTab: 'tab-nohref' }],
    };

    render(
      <PaneTabsLayout
        initialLayout={layout}
        initialTabs={tabsNoHref}
        onOpenLink={onOpenLink}
      />
    );

    fireEvent.click(screen.getByTestId('anchor-no-href'));

    // openLink should not be called for an <a> without href
    expect(onOpenLink).not.toHaveBeenCalled();
  });

  // ============================================
  // Maximize / Restore
  // ============================================

  it('renders maximize button in each pane tab bar', () => {
    render(
      <PaneTabsLayout
        initialLayout={mockLayout}
        initialTabs={mockTabs}
      />
    );

    const maximizeBtns = screen.getAllByRole('button', { name: /maximize pane/i });
    // Two panes → two maximize buttons
    expect(maximizeBtns.length).toBe(2);
  });

  it('maximizes a pane when the maximize button is clicked', async () => {
    const { container } = render(
      <PaneTabsLayout
        initialLayout={mockLayout}
        initialTabs={mockTabs}
      />
    );

    // Both panes visible initially
    expect(screen.getByText('Tab 1')).toBeInTheDocument();
    expect(screen.getByText('Tab 3')).toBeInTheDocument();

    // Click the first maximize button (pane 1)
    const maximizeBtns = screen.getAllByRole('button', { name: /maximize pane/i });
    fireEvent.click(maximizeBtns[0]);

    // Layout should be in maximized state (data attribute set)
    await waitFor(() => {
      const layout = container.querySelector('.ptl-layout');
      expect(layout).toHaveAttribute('data-maximized-pane');
    });

    // The maximized pane has the data-maximized attribute
    const maximizedPane = container.querySelector('.ptl-pane[data-maximized]');
    expect(maximizedPane).toBeInTheDocument();

    // Sibling content is still in the DOM (CSS-hidden, not unmounted)
    expect(screen.getByText('Tab 3')).toBeInTheDocument();

    // Button should now show "Restore pane"
    expect(screen.getByRole('button', { name: /restore pane/i })).toBeInTheDocument();
  });

  it('restores the layout when the restore button is clicked', async () => {
    const { container } = render(
      <PaneTabsLayout
        initialLayout={mockLayout}
        initialTabs={mockTabs}
      />
    );

    // Maximize pane 1
    const maximizeBtns = screen.getAllByRole('button', { name: /maximize pane/i });
    fireEvent.click(maximizeBtns[0]);

    await waitFor(() => {
      expect(container.querySelector('.ptl-layout')).toHaveAttribute('data-maximized-pane');
    });

    // Click restore
    const restoreBtn = screen.getByRole('button', { name: /restore pane/i });
    fireEvent.click(restoreBtn);

    // Maximize state should be cleared
    await waitFor(() => {
      expect(container.querySelector('.ptl-layout')).not.toHaveAttribute('data-maximized-pane');
      expect(container.querySelector('.ptl-pane[data-maximized]')).not.toBeInTheDocument();
    });
  });

  it('restores layout via Escape key', async () => {
    const { container } = render(
      <PaneTabsLayout
        initialLayout={mockLayout}
        initialTabs={mockTabs}
      />
    );

    // Maximize pane 1
    const maximizeBtns = screen.getAllByRole('button', { name: /maximize pane/i });
    fireEvent.click(maximizeBtns[0]);

    await waitFor(() => {
      expect(container.querySelector('.ptl-layout')).toHaveAttribute('data-maximized-pane');
    });

    // Press Escape
    fireEvent.keyDown(document, { key: 'Escape' });

    // Maximize state should be cleared
    await waitFor(() => {
      expect(container.querySelector('.ptl-layout')).not.toHaveAttribute('data-maximized-pane');
    });
  });

  it('maximizePane and restorePane are available via useLayout', async () => {
    let maximizeFn: (id: string) => void = () => {};
    let restoreFn: () => void = () => {};
    let maximizedId: string | null = null;

    const TestComponent = () => {
      const { maximizePane, restorePane, maximizedPaneId } = useLayout();
      maximizeFn = maximizePane;
      restoreFn = restorePane;
      maximizedId = maximizedPaneId;
      return <span data-testid="hook-ready" />;
    };

    render(
      <LayoutProvider
        initialLayout={mockLayout}
        initialTabs={mockTabs}
      >
        <TestComponent />
      </LayoutProvider>
    );

    await waitFor(() => expect(screen.getByTestId('hook-ready')).toBeInTheDocument());

    // Initially no pane is maximized
    expect(maximizedId).toBeNull();

    // Maximize a pane
    maximizeFn('pane1');

    await waitFor(() => {
      expect(maximizedId).toBe('pane1');
    });

    // Restore
    restoreFn();

    await waitFor(() => {
      expect(maximizedId).toBeNull();
    });
  });

  it('maximizes a deeply nested pane showing only that branch', async () => {
    const deepLayout: LayoutConfig = {
      root: {
        id: 'root',
        type: 'split',
        direction: 'horizontal',
        children: [
          { id: 'pane-left', type: 'pane', tabs: ['tab1'], activeTab: 'tab1' },
          {
            id: 'split-right',
            type: 'split',
            direction: 'vertical',
            children: [
              { id: 'pane-top-right', type: 'pane', tabs: ['tab2'], activeTab: 'tab2' },
              { id: 'pane-bottom-right', type: 'pane', tabs: ['tab3'], activeTab: 'tab3' },
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

    // All three tabs visible
    expect(screen.getByText('Tab 1')).toBeInTheDocument();
    expect(screen.getByText('Tab 2')).toBeInTheDocument();
    expect(screen.getByText('Tab 3')).toBeInTheDocument();

    // Maximize the bottom-right pane (Tab 3)
    const maximizeBtns = screen.getAllByRole('button', { name: /maximize pane/i });
    // bottom-right is the last pane -> last button
    fireEvent.click(maximizeBtns[maximizeBtns.length - 1]);

    await waitFor(() => {
      // The maximized pane has the attribute
      const maximized = document.querySelector('.ptl-pane[data-maximized]');
      expect(maximized).toBeInTheDocument();
      // All three tabs are still in the DOM (CSS-hidden siblings, not unmounted)
      expect(screen.getByText('Tab 1')).toBeInTheDocument();
      expect(screen.getByText('Tab 2')).toBeInTheDocument();
      expect(screen.getByText('Tab 3')).toBeInTheDocument();
    });
  });

  it('auto-restores when the maximized pane is removed', async () => {
    const twoPane: LayoutConfig = {
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
        initialLayout={twoPane}
        initialTabs={mockTabs}
      />
    );

    // Maximize pane-b (Tab 3 only)
    const maximizeBtns = screen.getAllByRole('button', { name: /maximize pane/i });
    fireEvent.click(maximizeBtns[maximizeBtns.length - 1]);

    await waitFor(() => {
      const layout = document.querySelector('.ptl-layout');
      expect(layout).toHaveAttribute('data-maximized-pane');
    });

    // Close Tab 3 (the only tab in pane-b), removing the pane.
    // Use the specific aria-label since siblings stay mounted.
    const closeBtn = screen.getByRole('button', { name: /Close Tab 3/i });
    fireEvent.click(closeBtn);

    // Should auto-restore — maximized state cleared, pane-a still present
    await waitFor(() => {
      const layout = document.querySelector('.ptl-layout');
      expect(layout).not.toHaveAttribute('data-maximized-pane');
      expect(screen.getByText('Tab 1')).toBeInTheDocument();
      expect(screen.getByText('Tab 2')).toBeInTheDocument();
    });
  });

  it('double-click on tab bar empty area maximizes the pane', async () => {
    const { container } = render(
      <PaneTabsLayout
        initialLayout={mockLayout}
        initialTabs={mockTabs}
      />
    );

    // Double-click on the first pane's tab bar
    const tabBars = document.querySelectorAll('.ptl-tab-bar');
    expect(tabBars.length).toBeGreaterThanOrEqual(1);
    fireEvent.doubleClick(tabBars[0]);

    // Layout should be in maximized state
    await waitFor(() => {
      expect(container.querySelector('.ptl-layout')).toHaveAttribute('data-maximized-pane');
      expect(container.querySelector('.ptl-pane[data-maximized]')).toBeInTheDocument();
    });
  });

  it('keeps sibling panes mounted during maximize (preserves DOM state)', async () => {
    const { container } = render(
      <PaneTabsLayout
        initialLayout={mockLayout}
        initialTabs={mockTabs}
      />
    );

    // Count panes before maximize
    const panesBefore = container.querySelectorAll('.ptl-pane').length;
    expect(panesBefore).toBe(2);

    // Maximize first pane
    const maximizeBtns = screen.getAllByRole('button', { name: /maximize pane/i });
    fireEvent.click(maximizeBtns[0]);

    await waitFor(() => {
      expect(container.querySelector('.ptl-layout')).toHaveAttribute('data-maximized-pane');
    });

    // Same number of panes still in the DOM (nothing unmounted)
    const panesAfter = container.querySelectorAll('.ptl-pane').length;
    expect(panesAfter).toBe(panesBefore);
  });

  // ============================================
  // Tab Pinning
  // ============================================

  it('renders pinned tabs with pin indicator instead of close button', () => {
    const pinnedTabs: TabData[] = [
      {
        id: 'pinned-tab',
        title: 'Pinned',
        content: <div data-testid="pinned-content">Pinned Content</div>,
        pinned: true,
      },
      {
        id: 'normal-tab',
        title: 'Normal',
        content: <div data-testid="normal-content">Normal Content</div>,
        closable: true,
      },
    ];

    const layout: LayoutConfig = {
      panes: [
        { id: 'pane-pin', tabs: ['pinned-tab', 'normal-tab'], activeTab: 'pinned-tab' },
      ],
    };

    render(
      <PaneTabsLayout initialLayout={layout} initialTabs={pinnedTabs} />
    );

    // Pinned tab should have the pinned class
    const pinnedEl = screen.getByText('Pinned').closest('.ptl-tab');
    expect(pinnedEl).toHaveClass('ptl-tab-pinned');
    expect(pinnedEl).toHaveAttribute('data-pinned', 'true');

    // Pinned tab should have an unpin button, not a close button
    expect(screen.getByRole('button', { name: /unpin pinned/i })).toBeInTheDocument();

    // Normal tab should have a close button
    expect(screen.getByRole('button', { name: /close normal/i })).toBeInTheDocument();
  });

  it('renders pin separator between pinned and unpinned tabs', () => {
    const mixedTabs: TabData[] = [
      { id: 'p1', title: 'P1', content: <div>P1</div>, pinned: true },
      { id: 'u1', title: 'U1', content: <div>U1</div> },
    ];

    const layout: LayoutConfig = {
      panes: [{ id: 'pane-sep', tabs: ['p1', 'u1'], activeTab: 'p1' }],
    };

    const { container } = render(
      <PaneTabsLayout initialLayout={layout} initialTabs={mixedTabs} />
    );

    expect(container.querySelector('.ptl-pin-separator')).toBeInTheDocument();
  });

  it('does not render separator when all tabs are pinned', () => {
    const allPinned: TabData[] = [
      { id: 'p1', title: 'P1', content: <div>P1</div>, pinned: true },
      { id: 'p2', title: 'P2', content: <div>P2</div>, pinned: true },
    ];

    const layout: LayoutConfig = {
      panes: [{ id: 'pane-allpin', tabs: ['p1', 'p2'], activeTab: 'p1' }],
    };

    const { container } = render(
      <PaneTabsLayout initialLayout={layout} initialTabs={allPinned} />
    );

    expect(container.querySelector('.ptl-pin-separator')).not.toBeInTheDocument();
  });

  it('does not render separator when no tabs are pinned', () => {
    const noPinned: TabData[] = [
      { id: 'u1', title: 'U1', content: <div>U1</div> },
      { id: 'u2', title: 'U2', content: <div>U2</div> },
    ];

    const layout: LayoutConfig = {
      panes: [{ id: 'pane-nopin', tabs: ['u1', 'u2'], activeTab: 'u1' }],
    };

    const { container } = render(
      <PaneTabsLayout initialLayout={layout} initialTabs={noPinned} />
    );

    expect(container.querySelector('.ptl-pin-separator')).not.toBeInTheDocument();
  });

  it('pinTab via context pins a tab and moves it to the pinned group', async () => {
    let pinTabFn: (paneId: string, tabId: string) => void = () => {};
    let getTabsFn: () => Map<string, TabData> = () => new Map();

    const TestComponent = () => {
      const { pinTab, tabs: ctxTabs } = useLayout();
      pinTabFn = pinTab;
      getTabsFn = () => ctxTabs;
      return <span data-testid="hook-ready" />;
    };

    const layout: LayoutConfig = {
      panes: [
        { id: 'pane-a', tabs: ['tab1', 'tab2', 'tab3'], activeTab: 'tab1' },
      ],
    };

    render(
      <LayoutProvider initialLayout={layout} initialTabs={mockTabs}>
        <TestComponent />
      </LayoutProvider>
    );

    await waitFor(() => expect(screen.getByTestId('hook-ready')).toBeInTheDocument());

    // Pin tab2 (initially at index 1)
    pinTabFn('pane-a', 'tab2');

    await waitFor(() => {
      const tab2 = getTabsFn().get('tab2');
      expect(tab2?.pinned).toBe(true);
    });
  });

  it('unpinTab via context unpins a tab', async () => {
    let unpinTabFn: (paneId: string, tabId: string) => void = () => {};
    let getTabsFn: () => Map<string, TabData> = () => new Map();

    const pinnedTabs: TabData[] = [
      { id: 'p1', title: 'P1', content: <div>P1</div>, pinned: true },
      { id: 'u1', title: 'U1', content: <div>U1</div> },
    ];

    const TestComponent = () => {
      const { unpinTab, tabs: ctxTabs } = useLayout();
      unpinTabFn = unpinTab;
      getTabsFn = () => ctxTabs;
      return <span data-testid="hook-ready" />;
    };

    const layout: LayoutConfig = {
      panes: [
        { id: 'pane-a', tabs: ['p1', 'u1'], activeTab: 'p1' },
      ],
    };

    render(
      <LayoutProvider initialLayout={layout} initialTabs={pinnedTabs}>
        <TestComponent />
      </LayoutProvider>
    );

    await waitFor(() => expect(screen.getByTestId('hook-ready')).toBeInTheDocument());

    unpinTabFn('pane-a', 'p1');

    await waitFor(() => {
      const p1 = getTabsFn().get('p1');
      expect(p1?.pinned).toBe(false);
    });
  });

  it('clicking unpin button on a pinned tab unpins it', async () => {
    const pinnedTabs: TabData[] = [
      { id: 'pinned1', title: 'Pinned Tab', content: <div>Pinned</div>, pinned: true },
      { id: 'normal1', title: 'Normal Tab', content: <div>Normal</div> },
    ];

    const layout: LayoutConfig = {
      panes: [
        { id: 'pane-unpin', tabs: ['pinned1', 'normal1'], activeTab: 'pinned1' },
      ],
    };

    const { container } = render(
      <PaneTabsLayout initialLayout={layout} initialTabs={pinnedTabs} />
    );

    // Pinned tab should have the pin indicator
    expect(screen.getByRole('button', { name: /unpin pinned tab/i })).toBeInTheDocument();
    expect(container.querySelector('.ptl-pin-separator')).toBeInTheDocument();

    // Click the unpin button
    fireEvent.click(screen.getByRole('button', { name: /unpin pinned tab/i }));

    // After unpinning, the tab should no longer be pinned
    await waitFor(() => {
      const pinnedEl = screen.getByText('Pinned Tab').closest('.ptl-tab');
      expect(pinnedEl).not.toHaveClass('ptl-tab-pinned');
      // Separator should be gone (no more pinned tabs)
      expect(container.querySelector('.ptl-pin-separator')).not.toBeInTheDocument();
    });
  });

  it('unpinned tabs show a pin button with "Pin" label', () => {
    render(
      <PaneTabsLayout initialLayout={mockLayout} initialTabs={mockTabs} />
    );

    // Every unpinned tab should have a "Pin {title}" button
    expect(screen.getByRole('button', { name: /pin tab 1/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /pin tab 2/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /pin tab 3/i })).toBeInTheDocument();
  });

  it('unpinned closable tabs have both pin and close buttons', () => {
    render(
      <PaneTabsLayout initialLayout={mockLayout} initialTabs={mockTabs} />
    );

    // Tab 1 is closable (default) and unpinned → both buttons
    expect(screen.getByRole('button', { name: /pin tab 1/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /close tab 1/i })).toBeInTheDocument();
  });

  it('clicking pin button on an unpinned tab pins it', async () => {
    render(
      <PaneTabsLayout initialLayout={mockLayout} initialTabs={mockTabs} />
    );

    const tab1El = screen.getByText('Tab 1').closest('.ptl-tab');
    expect(tab1El).not.toHaveClass('ptl-tab-pinned');

    // Click the pin button
    fireEvent.click(screen.getByRole('button', { name: /pin tab 1/i }));

    // Tab 1 should now be pinned
    await waitFor(() => {
      const el = screen.getByText('Tab 1').closest('.ptl-tab');
      expect(el).toHaveClass('ptl-tab-pinned');
      // Pin button should now show "Unpin" label
      expect(screen.getByRole('button', { name: /unpin tab 1/i })).toBeInTheDocument();
      // Close button should be gone (pinned tabs don't show close)
      expect(screen.queryByRole('button', { name: /close tab 1/i })).not.toBeInTheDocument();
    });
  });

  it('pinned tab has no close button, only unpin button', () => {
    const pinnedTabs: TabData[] = [
      { id: 'p1', title: 'Alpha', content: <div>A</div>, pinned: true },
    ];
    const layout: LayoutConfig = {
      panes: [{ id: 'pane-p', tabs: ['p1'], activeTab: 'p1' }],
    };

    render(
      <PaneTabsLayout initialLayout={layout} initialTabs={pinnedTabs} />
    );

    expect(screen.getByRole('button', { name: /unpin alpha/i })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /close alpha/i })).not.toBeInTheDocument();
  });

  it('addTab places pinned tabs at end of pinned group', async () => {
    let addTabFn: (paneId: string, tab: TabData) => void = () => {};
    let getPanesFn: () => Map<string, any> = () => new Map();

    const initialPinnedTabs: TabData[] = [
      { id: 'p1', title: 'P1', content: <div>P1</div>, pinned: true },
      { id: 'u1', title: 'U1', content: <div>U1</div> },
    ];

    const TestComponent = () => {
      const { addTab, panes: ctxPanes } = useLayout();
      addTabFn = addTab;
      getPanesFn = () => ctxPanes;
      return <span data-testid="hook-ready" />;
    };

    const layout: LayoutConfig = {
      panes: [{ id: 'pane-add', tabs: ['p1', 'u1'], activeTab: 'p1' }],
    };

    render(
      <LayoutProvider initialLayout={layout} initialTabs={initialPinnedTabs}>
        <TestComponent />
      </LayoutProvider>
    );

    await waitFor(() => expect(screen.getByTestId('hook-ready')).toBeInTheDocument());

    // Add a new pinned tab
    addTabFn('pane-add', {
      id: 'p2',
      title: 'P2',
      content: <div>P2</div>,
      pinned: true,
    });

    await waitFor(() => {
      const pane = getPanesFn().get('pane-add');
      // p2 should be inserted after p1 (end of pinned group) but before u1
      expect(pane.tabs).toEqual(['p1', 'p2', 'u1']);
    });
  });

  it('addTab places unpinned tabs at the end', async () => {
    let addTabFn: (paneId: string, tab: TabData) => void = () => {};
    let getPanesFn: () => Map<string, any> = () => new Map();

    const initialPinnedTabs: TabData[] = [
      { id: 'p1', title: 'P1', content: <div>P1</div>, pinned: true },
      { id: 'u1', title: 'U1', content: <div>U1</div> },
    ];

    const TestComponent = () => {
      const { addTab, panes: ctxPanes } = useLayout();
      addTabFn = addTab;
      getPanesFn = () => ctxPanes;
      return <span data-testid="hook-ready" />;
    };

    const layout: LayoutConfig = {
      panes: [{ id: 'pane-add2', tabs: ['p1', 'u1'], activeTab: 'p1' }],
    };

    render(
      <LayoutProvider initialLayout={layout} initialTabs={initialPinnedTabs}>
        <TestComponent />
      </LayoutProvider>
    );

    await waitFor(() => expect(screen.getByTestId('hook-ready')).toBeInTheDocument());

    addTabFn('pane-add2', {
      id: 'u2',
      title: 'U2',
      content: <div>U2</div>,
    });

    await waitFor(() => {
      const pane = getPanesFn().get('pane-add2');
      expect(pane.tabs).toEqual(['p1', 'u1', 'u2']);
    });
  });

  it('right-click on a tab shows context menu with Pin Tab option', async () => {
    render(
      <PaneTabsLayout initialLayout={mockLayout} initialTabs={mockTabs} />
    );

    const tab1 = screen.getByText('Tab 1');
    fireEvent.contextMenu(tab1);

    await waitFor(() => {
      expect(screen.getByRole('menu')).toBeInTheDocument();
      expect(screen.getByText('Pin Tab')).toBeInTheDocument();
    });
  });

  it('right-click on a pinned tab shows Unpin Tab option', async () => {
    const pinnedTabs: TabData[] = [
      { id: 'p1', title: 'Pinned', content: <div>Pinned</div>, pinned: true },
    ];
    const layout: LayoutConfig = {
      panes: [{ id: 'pane-ctx', tabs: ['p1'], activeTab: 'p1' }],
    };

    render(
      <PaneTabsLayout initialLayout={layout} initialTabs={pinnedTabs} />
    );

    fireEvent.contextMenu(screen.getByRole('tab', { name: /Pinned/ }));

    await waitFor(() => {
      expect(screen.getByRole('menu')).toBeInTheDocument();
      expect(screen.getByText('Unpin Tab')).toBeInTheDocument();
    });
  });

  it('clicking Pin Tab in context menu pins the tab', async () => {
    render(
      <PaneTabsLayout initialLayout={mockLayout} initialTabs={mockTabs} />
    );

    // Right-click Tab 1
    fireEvent.contextMenu(screen.getByText('Tab 1'));

    await waitFor(() => {
      expect(screen.getByText('Pin Tab')).toBeInTheDocument();
    });

    // Click "Pin Tab"
    fireEvent.click(screen.getByText('Pin Tab'));

    // Tab 1 should now be pinned
    await waitFor(() => {
      const tab1El = screen.getByText('Tab 1').closest('.ptl-tab');
      expect(tab1El).toHaveClass('ptl-tab-pinned');
    });

    // Context menu should be closed
    expect(screen.queryByRole('menu')).not.toBeInTheDocument();
  });

  it('clicking Unpin Tab in context menu unpins the tab', async () => {
    const pinnedTabs: TabData[] = [
      { id: 'p1', title: 'Pinned', content: <div>Pinned</div>, pinned: true },
      { id: 'u1', title: 'Unpinned', content: <div>Unpinned</div> },
    ];
    const layout: LayoutConfig = {
      panes: [{ id: 'pane-ctx2', tabs: ['p1', 'u1'], activeTab: 'p1' }],
    };

    render(
      <PaneTabsLayout initialLayout={layout} initialTabs={pinnedTabs} />
    );

    // Right-click the pinned tab
    fireEvent.contextMenu(screen.getByRole('tab', { name: /Pinned/ }));

    await waitFor(() => {
      expect(screen.getByText('Unpin Tab')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText('Unpin Tab'));

    // Tab should be unpinned
    await waitFor(() => {
      const tabEl = screen.getByRole('tab', { name: /Pinned/ });
      expect(tabEl).not.toHaveClass('ptl-tab-pinned');
    });
  });

  it('context menu shows Close Tab for closable tabs', async () => {
    render(
      <PaneTabsLayout initialLayout={mockLayout} initialTabs={mockTabs} />
    );

    // Tab 1 is closable by default (closable not set = true)
    fireEvent.contextMenu(screen.getByText('Tab 1'));

    await waitFor(() => {
      expect(screen.getByText('Close Tab')).toBeInTheDocument();
    });
  });

  it('context menu hides Close Tab for non-closable tabs', async () => {
    const nonClosableTabs: TabData[] = [
      { id: 'nc1', title: 'No Close', content: <div>NC</div>, closable: false },
    ];
    const layout: LayoutConfig = {
      panes: [{ id: 'pane-nc', tabs: ['nc1'], activeTab: 'nc1' }],
    };

    render(
      <PaneTabsLayout initialLayout={layout} initialTabs={nonClosableTabs} />
    );

    fireEvent.contextMenu(screen.getByText('No Close'));

    await waitFor(() => {
      expect(screen.getByText('Pin Tab')).toBeInTheDocument();
      expect(screen.queryByText('Close Tab')).not.toBeInTheDocument();
    });
  });

  it('clicking Close Tab in context menu closes the tab', async () => {
    render(
      <PaneTabsLayout initialLayout={mockLayout} initialTabs={mockTabs} />
    );

    expect(screen.getByText('Tab 1')).toBeInTheDocument();

    fireEvent.contextMenu(screen.getByText('Tab 1'));

    await waitFor(() => {
      expect(screen.getByText('Close Tab')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText('Close Tab'));

    await waitFor(() => {
      expect(screen.queryByText('Tab 1')).not.toBeInTheDocument();
    });
  });

  it('context menu closes on Escape key', async () => {
    render(
      <PaneTabsLayout initialLayout={mockLayout} initialTabs={mockTabs} />
    );

    fireEvent.contextMenu(screen.getByText('Tab 1'));

    await waitFor(() => {
      expect(screen.getByRole('menu')).toBeInTheDocument();
    });

    fireEvent.keyDown(document, { key: 'Escape' });

    await waitFor(() => {
      expect(screen.queryByRole('menu')).not.toBeInTheDocument();
    });
  });

  it('pinTab and unpinTab are accessible via useLayout hook', async () => {
    let pinFn: (paneId: string, tabId: string) => void = () => {};
    let unpinFn: (paneId: string, tabId: string) => void = () => {};

    const TestComponent = () => {
      const { pinTab, unpinTab } = useLayout();
      pinFn = pinTab;
      unpinFn = unpinTab;
      return <span data-testid="hook-ready" />;
    };

    render(
      <LayoutProvider initialLayout={mockLayout} initialTabs={mockTabs}>
        <TestComponent />
      </LayoutProvider>
    );

    await waitFor(() => expect(screen.getByTestId('hook-ready')).toBeInTheDocument());

    expect(typeof pinFn).toBe('function');
    expect(typeof unpinFn).toBe('function');
  });
});

// ============================================
// PaneLink Component Tests
// ============================================

describe('PaneLink', () => {
  const problemResolver = (url: string): TabData | null => {
    const match = url.match(/\/problem\/(\w+)/);
    if (match) {
      return {
        id: `problem-${match[1]}`,
        title: `Problem ${match[1]}`,
        content: <div data-testid={`problem-${match[1]}-content`}>Problem {match[1]}</div>,
      };
    }
    return null;
  };

  const renderWithProvider = (
    ui: React.ReactNode,
    onOpenLink?: (url: string) => TabData | null,
  ) => {
    const layout: LayoutConfig = {
      panes: [{ id: 'pane-main', tabs: ['tab1'], activeTab: 'tab1' }],
    };
    const tabs: TabData[] = [
      { id: 'tab1', title: 'Tab 1', content: <div>Tab 1</div> },
    ];
    return render(
      <LayoutProvider initialLayout={layout} initialTabs={tabs} onOpenLink={onOpenLink}>
        {ui}
      </LayoutProvider>
    );
  };

  it('renders as an <a> with the correct href and children', () => {
    renderWithProvider(
      <PaneLink href="https://example.com/problem/10">Link Text</PaneLink>,
      problemResolver,
    );

    const link = screen.getByText('Link Text');
    expect(link.tagName).toBe('A');
    expect(link).toHaveAttribute('href', 'https://example.com/problem/10');
  });

  it('passes extra HTML attributes through to the <a> element', () => {
    renderWithProvider(
      <PaneLink href="/foo" className="custom-class" data-testid="custom-link">Styled</PaneLink>,
      problemResolver,
    );

    const link = screen.getByTestId('custom-link');
    expect(link).toHaveClass('custom-class');
    expect(link).toHaveAttribute('href', '/foo');
  });

  it('calls onOpenLink and prevents default when resolver returns TabData', () => {
    const onOpenLink = vi.fn(problemResolver);

    renderWithProvider(
      <PaneLink href="https://example.com/problem/33">Problem 33</PaneLink>,
      onOpenLink,
    );

    const link = screen.getByText('Problem 33');
    const clickEvent = new MouseEvent('click', { bubbles: true, cancelable: true });
    const preventDefaultSpy = vi.spyOn(clickEvent, 'preventDefault');

    link.dispatchEvent(clickEvent);

    expect(onOpenLink).toHaveBeenCalledWith('https://example.com/problem/33');
    expect(preventDefaultSpy).toHaveBeenCalled();
  });

  it('does NOT preventDefault when resolver returns null (unhandled link)', () => {
    const onOpenLink = vi.fn(() => null);

    renderWithProvider(
      <PaneLink href="https://unknown.com/page">Unknown</PaneLink>,
      onOpenLink,
    );

    const link = screen.getByText('Unknown');
    const clickEvent = new MouseEvent('click', { bubbles: true, cancelable: true });
    const preventDefaultSpy = vi.spyOn(clickEvent, 'preventDefault');

    link.dispatchEvent(clickEvent);

    expect(onOpenLink).toHaveBeenCalledWith('https://unknown.com/page');
    expect(preventDefaultSpy).not.toHaveBeenCalled();
  });

  it('forwards custom onClick prop and runs it before openLink', () => {
    const customOnClick = vi.fn();
    const onOpenLink = vi.fn(problemResolver);

    renderWithProvider(
      <PaneLink href="https://example.com/problem/5" onClick={customOnClick}>
        Click Me
      </PaneLink>,
      onOpenLink,
    );

    fireEvent.click(screen.getByText('Click Me'));

    // Both should be called: custom onClick first, then onOpenLink
    expect(customOnClick).toHaveBeenCalled();
    expect(onOpenLink).toHaveBeenCalled();
  });

  it('skips openLink when custom onClick calls preventDefault', () => {
    const customOnClick = vi.fn((e: React.MouseEvent) => {
      e.preventDefault();
    });
    const onOpenLink = vi.fn(problemResolver);

    renderWithProvider(
      <PaneLink href="https://example.com/problem/5" onClick={customOnClick}>
        Prevented
      </PaneLink>,
      onOpenLink,
    );

    fireEvent.click(screen.getByText('Prevented'));

    expect(customOnClick).toHaveBeenCalled();
    // onOpenLink should NOT be called because custom onClick prevented default
    expect(onOpenLink).not.toHaveBeenCalled();
  });

  it('targets a specific pane when paneId prop is provided', () => {
    const onOpenLink = vi.fn(problemResolver);

    const layout: LayoutConfig = {
      panes: [
        { id: 'left-pane', tabs: ['tab1'], activeTab: 'tab1' },
        { id: 'right-pane', tabs: ['tab2'], activeTab: 'tab2' },
      ],
    };
    const tabs: TabData[] = [
      { id: 'tab1', title: 'Tab 1', content: <div>Tab 1</div> },
      { id: 'tab2', title: 'Tab 2', content: <div>Tab 2</div> },
    ];

    render(
      <LayoutProvider initialLayout={layout} initialTabs={tabs} onOpenLink={onOpenLink}>
        <PaneLink href="https://example.com/problem/20" paneId="right-pane">
          Open in Right
        </PaneLink>
      </LayoutProvider>
    );

    fireEvent.click(screen.getByText('Open in Right'));

    expect(onOpenLink).toHaveBeenCalledWith('https://example.com/problem/20');
  });

  it('works without onOpenLink (openLink returns null, no crash)', () => {
    // No onOpenLink provided
    renderWithProvider(
      <PaneLink href="https://example.com/problem/1">Safe Link</PaneLink>,
    );

    // Should not throw
    fireEvent.click(screen.getByText('Safe Link'));
    expect(screen.getByText('Safe Link')).toBeInTheDocument();
  });
});
