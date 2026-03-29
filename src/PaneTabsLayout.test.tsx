import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { PaneTabsLayout } from './PaneTabsLayout';
import { useLayout, LayoutProvider } from './LayoutContext';
import { Tab } from './Tab';
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

// Additional mock data for Phase 1 tests
const mockTabsWithIcons: TabData[] = [
  {
    id: 'tab1',
    title: 'Tab 1',
    content: <div>Content</div>,
    icon: <span data-testid="tab-icon">📝</span>,
  },
];

const mockTabsNotClosable: TabData[] = [
  {
    id: 'tab1',
    title: 'Tab 1',
    content: <div>Content</div>,
    closable: false,
  },
];

const emptyLayout: LayoutConfig = {
  panes: [
    {
      id: 'pane1',
      tabs: [],
      activeTab: undefined,
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

  // ========== Phase 1 Tests ==========

  it('calls onTabsChange when tab is closed', async () => {
    const onTabsChange = vi.fn();

    render(
      <PaneTabsLayout
        initialLayout={mockLayout}
        initialTabs={mockTabs}
        onTabsChange={onTabsChange}
      />
    );

    // Tab 3 is closable - find and click its close button
    const tab3 = screen.getByRole('tab', { name: /Tab 3/i });
    const closeButton = tab3.querySelector('.ptl-tab-close');
    expect(closeButton).toBeInTheDocument();

    fireEvent.click(closeButton!);

    // onTabsChange should be called
    await waitFor(() => {
      expect(onTabsChange).toHaveBeenCalled();
    });
  });

  it('renders with custom inline styles', () => {
    const customStyle = { backgroundColor: 'rgb(255, 0, 0)', padding: '20px' };
    const { container } = render(
      <PaneTabsLayout
        initialLayout={mockLayout}
        initialTabs={mockTabs}
        style={customStyle}
      />
    );

    const layoutElement = container.querySelector('.ptl-layout');
    expect(layoutElement).toHaveStyle('background-color: rgb(255, 0, 0)');
    expect(layoutElement).toHaveStyle('padding: 20px');
  });

  it('renders with empty layout (no tabs)', () => {
    const { container } = render(
      <PaneTabsLayout
        initialLayout={emptyLayout}
        initialTabs={[]}
      />
    );

    // Should render without crashing
    expect(container.querySelector('.ptl-layout')).toBeInTheDocument();
  });

  it('displays tab icon when provided', () => {
    const layoutWithIcon: LayoutConfig = {
      panes: [
        {
          id: 'pane1',
          tabs: ['tab1'],
          activeTab: 'tab1',
        },
      ],
    };

    render(
      <PaneTabsLayout
        initialLayout={layoutWithIcon}
        initialTabs={mockTabsWithIcons}
      />
    );

    expect(screen.getByTestId('tab-icon')).toBeInTheDocument();
    expect(screen.getByText('📝')).toBeInTheDocument();
  });

  it('hides close button when closable is false', () => {
    const layoutNotClosable: LayoutConfig = {
      panes: [
        {
          id: 'pane1',
          tabs: ['tab1'],
          activeTab: 'tab1',
        },
      ],
    };

    render(
      <PaneTabsLayout
        initialLayout={layoutNotClosable}
        initialTabs={mockTabsNotClosable}
      />
    );

    const tab = screen.getByRole('tab', { name: /Tab 1/i });
    const closeButton = tab.querySelector('.ptl-tab-close');
    expect(closeButton).not.toBeInTheDocument();
  });

  it('shows close button by default when closable is not specified', () => {
    const layoutDefault: LayoutConfig = {
      panes: [
        {
          id: 'pane1',
          tabs: ['tab1'],
          activeTab: 'tab1',
        },
      ],
    };

    const tabsDefault: TabData[] = [
      {
        id: 'tab1',
        title: 'Tab 1',
        content: <div>Content</div>,
        // closable not specified - should default to true
      },
    ];

    render(
      <PaneTabsLayout
        initialLayout={layoutDefault}
        initialTabs={tabsDefault}
      />
    );

    const tab = screen.getByRole('tab', { name: /Tab 1/i });
    const closeButton = tab.querySelector('.ptl-tab-close');
    expect(closeButton).toBeInTheDocument();
  });

  it('has correct ARIA attributes on tabs', () => {
    render(
      <PaneTabsLayout
        initialLayout={mockLayout}
        initialTabs={mockTabs}
      />
    );

    // All tabs should have role="tab"
    const tabs = screen.getAllByRole('tab');
    expect(tabs.length).toBe(3);

    // Active tabs should have aria-selected="true" (one per pane)
    const activeTabs = screen.getAllByRole('tab', { selected: true });
    expect(activeTabs.length).toBe(2); // tab1 in pane1, tab3 in pane2
    activeTabs.forEach(tab => {
      expect(tab).toHaveAttribute('aria-selected', 'true');
    });

    // Inactive tabs should have aria-selected="false"
    const inactiveTabs = screen.getAllByRole('tab', { selected: false });
    expect(inactiveTabs.length).toBe(1); // tab2 is inactive
    inactiveTabs.forEach(tab => {
      expect(tab).toHaveAttribute('aria-selected', 'false');
    });
  });

  it('close button has correct ARIA label', () => {
    const singleTabLayout: LayoutConfig = {
      panes: [
        {
          id: 'pane1',
          tabs: ['tab1'],
          activeTab: 'tab1',
        },
      ],
    };

    const singleTab: TabData[] = [
      {
        id: 'tab1',
        title: 'My Tab',
        content: <div>Content</div>,
        closable: true,
      },
    ];

    render(
      <PaneTabsLayout
        initialLayout={singleTabLayout}
        initialTabs={singleTab}
      />
    );

    const closeButton = screen.getByRole('button', { name: /Close My Tab/i });
    expect(closeButton).toBeInTheDocument();
    expect(closeButton).toHaveAttribute('aria-label', 'Close My Tab');
  });

  it('renders collapsed pane state when no tabs', () => {
    render(
      <PaneTabsLayout
        initialLayout={emptyLayout}
        initialTabs={[]}
      />
    );

    // Should show collapsed state
    expect(screen.getByText('Drop tabs here')).toBeInTheDocument();
  });

  it('does not call onLayoutChange or onTabsChange on initial render', () => {
    const onLayoutChange = vi.fn();
    const onTabsChange = vi.fn();

    render(
      <PaneTabsLayout
        initialLayout={mockLayout}
        initialTabs={mockTabs}
        onLayoutChange={onLayoutChange}
        onTabsChange={onTabsChange}
      />
    );

    // Callbacks should not be called on initial render - only on changes
    expect(onLayoutChange).not.toHaveBeenCalled();
    expect(onTabsChange).not.toHaveBeenCalled();
  });

  it('preserves tab data property', () => {
    const tabsWithData: TabData[] = [
      {
        id: 'tab1',
        title: 'Tab 1',
        content: <div>Content</div>,
        data: { customField: 'customValue', number: 42 },
      },
    ];

    const layout: LayoutConfig = {
      panes: [
        {
          id: 'pane1',
          tabs: ['tab1'],
          activeTab: 'tab1',
        },
      ],
    };

    render(
      <PaneTabsLayout
        initialLayout={layout}
        initialTabs={tabsWithData}
      />
    );

    // Tab should render correctly with data
    expect(screen.getByRole('tab', { name: /Tab 1/i })).toBeInTheDocument();
  });

  it('preserves tab data property', () => {
    const tabsWithData: TabData[] = [
      {
        id: 'tab1',
        title: 'Tab 1',
        content: <div>Content</div>,
        data: { customField: 'customValue', number: 42 },
      },
    ];

    const layout: LayoutConfig = {
      panes: [
        {
          id: 'pane1',
          tabs: ['tab1'],
          activeTab: 'tab1',
        },
      ],
    };

    render(
      <PaneTabsLayout
        initialLayout={layout}
        initialTabs={tabsWithData}
      />
    );

    // Tab should render correctly with data
    expect(screen.getByRole('tab', { name: /Tab 1/i })).toBeInTheDocument();
  });

  // ========== Phase 2 Tests: useLayout Hook & Programmatic API ==========

  it('useLayout throws error when used outside LayoutProvider', () => {
    // Suppress console.error for this test since we expect an error
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    const BadComponent = () => {
      useLayout();
      return <div>Should not render</div>;
    };

    expect(() => {
      render(<BadComponent />);
    }).toThrow('useLayout must be used within a LayoutProvider');

    consoleSpy.mockRestore();
  });

  it('addTab adds a new tab to a pane and calls onTabsChange', async () => {
    const onTabsChange = vi.fn();

    const TestDisplay = () => {
      const { addTab, tabs } = useLayout();
      return (
        <div>
          <div data-testid="tabs-count">{tabs.size}</div>
          <button
            data-testid="add-tab-btn"
            onClick={() =>
              addTab('pane1', {
                id: 'new-tab',
                title: 'New Tab',
                content: <div>New Content</div>,
              })
            }
          >
            Add Tab
          </button>
        </div>
      );
    };

    render(
      <LayoutProvider
        initialLayout={mockLayout}
        initialTabs={mockTabs}
        onTabsChange={onTabsChange}
      >
        <TestDisplay />
      </LayoutProvider>
    );

    // Initially 3 tabs
    expect(screen.getByTestId('tabs-count')).toHaveTextContent('3');

    // Add new tab
    fireEvent.click(screen.getByTestId('add-tab-btn'));

    // Should have 4 tabs now
    await waitFor(() => {
      expect(screen.getByTestId('tabs-count')).toHaveTextContent('4');
    });

    // onTabsChange should be called
    expect(onTabsChange).toHaveBeenCalled();
  });

  it('addTab with activate=true sets active tab', async () => {
    const TestDisplay = () => {
      const { addTab, panes } = useLayout();
      const pane1 = panes.get('pane1');
      return (
        <div>
          <div data-testid="active-tab">{pane1?.activeTab || 'none'}</div>
          <button
            data-testid="add-tab-btn"
            onClick={() =>
              addTab(
                'pane1',
                {
                  id: 'new-tab',
                  title: 'New Tab',
                  content: <div>New Content</div>,
                },
                true
              )
            }
          >
            Add Tab
          </button>
        </div>
      );
    };

    render(
      <LayoutProvider initialLayout={mockLayout} initialTabs={mockTabs}>
        <TestDisplay />
      </LayoutProvider>
    );

    // Initially tab1 is active
    expect(screen.getByTestId('active-tab')).toHaveTextContent('tab1');

    // Add and activate new tab
    fireEvent.click(screen.getByTestId('add-tab-btn'));

    // New tab should be active
    await waitFor(() => {
      expect(screen.getByTestId('active-tab')).toHaveTextContent('new-tab');
    });
  });

  it('activateTab changes active tab', async () => {
    const TestDisplay = () => {
      const { activateTab, panes } = useLayout();
      const pane1 = panes.get('pane1');
      return (
        <div>
          <div data-testid="active-tab">{pane1?.activeTab || 'none'}</div>
          <button data-testid="activate-btn" onClick={() => activateTab('pane1', 'tab2')}>
            Activate Tab 2
          </button>
        </div>
      );
    };

    render(
      <LayoutProvider initialLayout={mockLayout} initialTabs={mockTabs}>
        <TestDisplay />
      </LayoutProvider>
    );

    // Initially tab1 is active
    expect(screen.getByTestId('active-tab')).toHaveTextContent('tab1');

    // Activate tab2
    fireEvent.click(screen.getByTestId('activate-btn'));

    // Tab2 should be active
    await waitFor(() => {
      expect(screen.getByTestId('active-tab')).toHaveTextContent('tab2');
    });
  });

  it('closeTab removes tab and calls onTabsChange', async () => {
    const onTabsChange = vi.fn();

    const TestDisplay = () => {
      const { closeTab, panes } = useLayout();
      const pane1 = panes.get('pane1');
      return (
        <div>
          <div data-testid="pane1-tabs">{(pane1?.tabs || []).join(',')}</div>
          <button data-testid="close-btn" onClick={() => closeTab('pane1', 'tab1')}>
            Close Tab 1
          </button>
        </div>
      );
    };

    render(
      <LayoutProvider
        initialLayout={mockLayout}
        initialTabs={mockTabs}
        onTabsChange={onTabsChange}
      >
        <TestDisplay />
      </LayoutProvider>
    );

    // Initially pane1 has tab1, tab2
    expect(screen.getByTestId('pane1-tabs')).toHaveTextContent('tab1,tab2');

    // Close tab1
    fireEvent.click(screen.getByTestId('close-btn'));

    // Tab1 should be removed from pane1
    await waitFor(() => {
      expect(screen.getByTestId('pane1-tabs')).toHaveTextContent('tab2');
    });

    // onTabsChange should be called
    expect(onTabsChange).toHaveBeenCalled();
  });

  it('moveTab moves tab between panes and calls onLayoutChange', async () => {
    const onLayoutChange = vi.fn();

    const TestDisplay = () => {
      const { moveTab, panes } = useLayout();
      const pane1 = panes.get('pane1');
      const pane2 = panes.get('pane2');
      return (
        <div>
          <div data-testid="pane1-tabs">{(pane1?.tabs || []).join(',')}</div>
          <div data-testid="pane2-tabs">{(pane2?.tabs || []).join(',')}</div>
          <button data-testid="move-btn" onClick={() => moveTab('tab1', 'pane1', 'pane2')}>
            Move Tab 1 to Pane 2
          </button>
        </div>
      );
    };

    render(
      <LayoutProvider
        initialLayout={mockLayout}
        initialTabs={mockTabs}
        onLayoutChange={onLayoutChange}
      >
        <TestDisplay />
      </LayoutProvider>
    );

    // Initially: pane1 has tab1,tab2; pane2 has tab3
    expect(screen.getByTestId('pane1-tabs')).toHaveTextContent('tab1,tab2');
    expect(screen.getByTestId('pane2-tabs')).toHaveTextContent('tab3');

    // Move tab1 to pane2
    fireEvent.click(screen.getByTestId('move-btn'));

    // Tab1 should move to pane2
    await waitFor(() => {
      expect(screen.getByTestId('pane1-tabs')).toHaveTextContent('tab2');
      expect(screen.getByTestId('pane2-tabs')).toHaveTextContent('tab3,tab1');
    });

    expect(onLayoutChange).toHaveBeenCalled();
  });

  it('moveTab reorders tabs within same pane', async () => {
    const onLayoutChange = vi.fn();

    const TestDisplay = () => {
      const { moveTab, panes } = useLayout();
      const pane1 = panes.get('pane1');
      return (
        <div>
          <div data-testid="pane1-tabs">{(pane1?.tabs || []).join(',')}</div>
          <button data-testid="reorder-btn" onClick={() => moveTab('tab2', 'pane1', 'pane1', 0)}>
            Move Tab 2 to position 0
          </button>
        </div>
      );
    };

    render(
      <LayoutProvider
        initialLayout={mockLayout}
        initialTabs={mockTabs}
        onLayoutChange={onLayoutChange}
      >
        <TestDisplay />
      </LayoutProvider>
    );

    // Initially: tab1, tab2
    expect(screen.getByTestId('pane1-tabs')).toHaveTextContent('tab1,tab2');

    // Move tab2 to position 0
    fireEvent.click(screen.getByTestId('reorder-btn'));

    // Should be: tab2, tab1
    await waitFor(() => {
      expect(screen.getByTestId('pane1-tabs')).toHaveTextContent('tab2,tab1');
    });

    expect(onLayoutChange).toHaveBeenCalled();
  });

  it('removePane removes a pane and calls onLayoutChange', async () => {
    const onLayoutChange = vi.fn();

    const TestDisplay = () => {
      const { removePane, panes } = useLayout();
      return (
        <div>
          <div data-testid="pane-count">{panes.size}</div>
          <button data-testid="remove-btn" onClick={() => removePane('pane2')}>
            Remove Pane 2
          </button>
        </div>
      );
    };

    render(
      <LayoutProvider
        initialLayout={mockLayout}
        initialTabs={mockTabs}
        onLayoutChange={onLayoutChange}
      >
        <TestDisplay />
      </LayoutProvider>
    );

    // Initially 2 panes
    expect(screen.getByTestId('pane-count')).toHaveTextContent('2');

    // Remove pane2
    fireEvent.click(screen.getByTestId('remove-btn'));

    // Should have 1 pane now
    await waitFor(() => {
      expect(screen.getByTestId('pane-count')).toHaveTextContent('1');
    });

    expect(onLayoutChange).toHaveBeenCalled();
  });

  it('renders with tree-based layout configuration', () => {
    const treeLayout: LayoutConfig = {
      root: {
        id: 'root',
        type: 'split',
        direction: 'horizontal',
        children: [
          {
            id: 'left-pane',
            type: 'pane',
            tabs: ['tab1'],
            activeTab: 'tab1',
          },
          {
            id: 'right-pane',
            type: 'pane',
            tabs: ['tab2'],
            activeTab: 'tab2',
          },
        ],
        sizes: [0.5, 0.5],
      },
    };

    render(<PaneTabsLayout initialLayout={treeLayout} initialTabs={mockTabs} />);

    // Both tabs should render
    expect(screen.getByRole('tab', { name: /Tab 1/i })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: /Tab 2/i })).toBeInTheDocument();
  });

  it('renders nested tree-based layout', () => {
    const nestedLayout: LayoutConfig = {
      root: {
        id: 'root',
        type: 'split',
        direction: 'vertical',
        children: [
          {
            id: 'top-split',
            type: 'split',
            direction: 'horizontal',
            children: [
              {
                id: 'top-left',
                type: 'pane',
                tabs: ['tab1'],
                activeTab: 'tab1',
              },
              {
                id: 'top-right',
                type: 'pane',
                tabs: ['tab2'],
                activeTab: 'tab2',
              },
            ],
            sizes: [0.5, 0.5],
          },
          {
            id: 'bottom-pane',
            type: 'pane',
            tabs: ['tab3'],
            activeTab: 'tab3',
          },
        ],
        sizes: [0.6, 0.4],
      },
    };

    render(<PaneTabsLayout initialLayout={nestedLayout} initialTabs={mockTabs} />);

    // All three tabs should render
    expect(screen.getByRole('tab', { name: /Tab 1/i })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: /Tab 2/i })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: /Tab 3/i })).toBeInTheDocument();
  });

  it('useLayout provides access to tabs and panes maps', async () => {
    const TestDisplay = () => {
      const { tabs, panes, rootNode } = useLayout();
      return (
        <div>
          <div data-testid="tabs-count">{tabs.size}</div>
          <div data-testid="panes-count">{panes.size}</div>
          <div data-testid="root-type">{rootNode?.type}</div>
        </div>
      );
    };

    const WrappedApp = () => (
      <LayoutProvider
        initialLayout={mockLayout}
        initialTabs={mockTabs}
      >
        <TestDisplay />
      </LayoutProvider>
    );

    render(<WrappedApp />);

    await waitFor(() => {
      expect(screen.getByTestId('tabs-count')).toHaveTextContent('3');
    });
    expect(screen.getByTestId('panes-count')).toHaveTextContent('2');
    expect(screen.getByTestId('root-type')).toHaveTextContent('split');
  });

  it('useLayout provides drag and drop state setters', async () => {
    const TestDisplay = () => {
      const { dragData, dropZone, setDragData, setDropZone } = useLayout();
      return (
        <div>
          <div data-testid="drag-data">{dragData ? 'dragging' : 'not-dragging'}</div>
          <div data-testid="drop-zone">{dropZone ? dropZone.direction : 'none'}</div>
          <button
            data-testid="start-drag"
            onClick={() => setDragData({ tabId: 'tab1', sourcePaneId: 'pane1' })}
          >
            Start Drag
          </button>
          <button data-testid="set-drop" onClick={() => setDropZone({ paneId: 'pane2', direction: 'center' })}>
            Set Drop
          </button>
          <button data-testid="clear-drag" onClick={() => setDragData(null)}>
            Clear Drag
          </button>
        </div>
      );
    };

    const WrappedApp = () => (
      <LayoutProvider
        initialLayout={mockLayout}
        initialTabs={mockTabs}
      >
        <TestDisplay />
      </LayoutProvider>
    );

    render(<WrappedApp />);

    // Wait for render
    await waitFor(() => {
      expect(screen.getByTestId('drag-data')).toBeInTheDocument();
    });

    // Initially no drag
    expect(screen.getByTestId('drag-data')).toHaveTextContent('not-dragging');
    expect(screen.getByTestId('drop-zone')).toHaveTextContent('none');

    // Start drag
    fireEvent.click(screen.getByTestId('start-drag'));
    expect(screen.getByTestId('drag-data')).toHaveTextContent('dragging');

    // Set drop zone
    fireEvent.click(screen.getByTestId('set-drop'));
    expect(screen.getByTestId('drop-zone')).toHaveTextContent('center');

    // Clear drag
    fireEvent.click(screen.getByTestId('clear-drag'));
    expect(screen.getByTestId('drag-data')).toHaveTextContent('not-dragging');
  });

  it('pane auto-cleanup when last tab is moved out', async () => {
    const singlePaneLayout: LayoutConfig = {
      panes: [
        {
          id: 'pane1',
          tabs: ['tab1'],
          activeTab: 'tab1',
        },
        {
          id: 'pane2',
          tabs: ['tab2'],
          activeTab: 'tab2',
        },
      ],
    };

    const twoTabs: TabData[] = [
      {
        id: 'tab1',
        title: 'Tab 1',
        content: <div data-testid="tab1-content">Tab 1</div>,
      },
      {
        id: 'tab2',
        title: 'Tab 2',
        content: <div data-testid="tab2-content">Tab 2</div>,
      },
    ];

    const TestDisplay = () => {
      const { moveTab, panes } = useLayout();
      return (
        <div>
          <button
            data-testid="move-btn"
            onClick={() => moveTab('tab1', 'pane1', 'pane2')}
          >
            Move Tab
          </button>
          <div data-testid="pane-count">{panes.size}</div>
        </div>
      );
    };

    const WrappedApp = () => (
      <LayoutProvider
        initialLayout={singlePaneLayout}
        initialTabs={twoTabs}
      >
        <PaneTabsLayout initialLayout={singlePaneLayout} initialTabs={twoTabs} />
        <TestDisplay />
      </LayoutProvider>
    );

    render(<WrappedApp />);

    // Wait for component to render
    await waitFor(() => {
      expect(screen.getByTestId('pane-count')).toHaveTextContent('2');
    });

    // Move tab1 to pane2 (pane1 becomes empty)
    fireEvent.click(screen.getByTestId('move-btn'));

    // Pane1 should be cleaned up, leaving only 1 pane
    await waitFor(() => {
      expect(screen.getByTestId('pane-count')).toHaveTextContent('1');
    });
  });

  // ========== Phase 3 Tests: Drag & Drop ==========

  it('Tab component has correct draggable attribute and data attribute', () => {
    const tab: TabData = {
      id: 'draggable-tab',
      title: 'Draggable Tab',
      content: <div>Content</div>,
    };

    const { container } = render(
      <LayoutProvider initialLayout={mockLayout} initialTabs={mockTabs}>
        <TabComponent tab={tab} isActive={false} />
      </LayoutProvider>
    );

    const tabElement = container.querySelector('.ptl-tab');
    
    // Tab should be draggable by default
    expect(tabElement).toHaveAttribute('draggable', 'true');
    // Should have data-tab-id for identification
    expect(tabElement).toHaveAttribute('data-tab-id', 'draggable-tab');
    // Should have role="tab"
    expect(tabElement).toHaveAttribute('role', 'tab');
    // Should have aria-selected="false" when not active
    expect(tabElement).toHaveAttribute('aria-selected', 'false');
  });

  it('Tab component respects draggable=false', () => {
    const tab: TabData = {
      id: 'non-draggable-tab',
      title: 'Non-Draggable Tab',
      content: <div>Content</div>,
      draggable: false,
    };

    const { container } = render(
      <LayoutProvider initialLayout={mockLayout} initialTabs={mockTabs}>
        <TabComponent tab={tab} isActive={false} />
      </LayoutProvider>
    );

    const tabElement = container.querySelector('.ptl-tab');
    expect(tabElement).toHaveAttribute('draggable', 'false');
  });

  it('drag and drop state management in context', async () => {
    const TestComponent = () => {
      const { dragData, dropZone, setDragData, setDropZone } = useLayout();
      return (
        <div>
          <div data-testid="drag-tab">{dragData?.tabId || 'none'}</div>
          <div data-testid="drag-pane">{dragData?.sourcePaneId || 'none'}</div>
          <div data-testid="drop-pane">{dropZone?.paneId || 'none'}</div>
          <div data-testid="drop-direction">{dropZone?.direction || 'none'}</div>
          <button
            data-testid="start-drag"
            onClick={() => setDragData({ tabId: 'tab1', sourcePaneId: 'pane1' })}
          >
            Start Drag
          </button>
          <button
            data-testid="set-drop-center"
            onClick={() => setDropZone({ paneId: 'pane2', direction: 'center' })}
          >
            Set Drop Center
          </button>
          <button
            data-testid="set-drop-left"
            onClick={() => setDropZone({ paneId: 'pane2', direction: 'left' })}
          >
            Set Drop Left
          </button>
          <button data-testid="clear-all" onClick={() => {
            setDragData(null);
            setDropZone(null);
          }}>
            Clear
          </button>
        </div>
      );
    };

    render(
      <LayoutProvider initialLayout={mockLayout} initialTabs={mockTabs}>
        <TestComponent />
      </LayoutProvider>
    );

    // Initially empty
    expect(screen.getByTestId('drag-tab')).toHaveTextContent('none');
    expect(screen.getByTestId('drop-direction')).toHaveTextContent('none');

    // Start drag
    fireEvent.click(screen.getByTestId('start-drag'));
    expect(screen.getByTestId('drag-tab')).toHaveTextContent('tab1');
    expect(screen.getByTestId('drag-pane')).toHaveTextContent('pane1');

    // Set drop zone center
    fireEvent.click(screen.getByTestId('set-drop-center'));
    expect(screen.getByTestId('drop-pane')).toHaveTextContent('pane2');
    expect(screen.getByTestId('drop-direction')).toHaveTextContent('center');

    // Set drop zone left (edge drop for split)
    fireEvent.click(screen.getByTestId('set-drop-left'));
    expect(screen.getByTestId('drop-direction')).toHaveTextContent('left');

    // Clear all
    fireEvent.click(screen.getByTestId('clear-all'));
    expect(screen.getByTestId('drag-tab')).toHaveTextContent('none');
    expect(screen.getByTestId('drop-direction')).toHaveTextContent('none');
  });

  it('splitPane creates new pane when moving tab to edge', async () => {
    const onLayoutChange = vi.fn();
    const singlePaneLayout: LayoutConfig = {
      panes: [
        {
          id: 'pane1',
          tabs: ['tab1', 'tab2'],
          activeTab: 'tab1',
        },
      ],
    };

    const twoTabs: TabData[] = [
      {
        id: 'tab1',
        title: 'Tab 1',
        content: <div>Tab 1 Content</div>,
      },
      {
        id: 'tab2',
        title: 'Tab 2',
        content: <div>Tab 2 Content</div>,
      },
    ];

    const TestComponent = () => {
      const { splitPane, panes, rootNode } = useLayout();
      return (
        <div>
          <div data-testid="pane-count">{panes.size}</div>
          <div data-testid="root-type">{rootNode?.type}</div>
          <button
            data-testid="split-right"
            onClick={() => splitPane('tab2', 'pane1', 'pane1', 'right')}
          >
            Split Right
          </button>
        </div>
      );
    };

    render(
      <LayoutProvider
        initialLayout={singlePaneLayout}
        initialTabs={twoTabs}
        onLayoutChange={onLayoutChange}
      >
        <TestComponent />
      </LayoutProvider>
    );

    // Initially 1 pane, root is pane (not split)
    expect(screen.getByTestId('pane-count')).toHaveTextContent('1');

    // Split pane by moving tab2 to right edge
    fireEvent.click(screen.getByTestId('split-right'));

    // Should now have 2 panes and root should be a split
    await waitFor(() => {
      expect(screen.getByTestId('pane-count')).toHaveTextContent('2');
    });
    expect(screen.getByTestId('root-type')).toHaveTextContent('split');
    expect(onLayoutChange).toHaveBeenCalled();
  });

  it('splitPane in all four directions', async () => {
    // Test each direction in isolation since splitPane modifies the tree
    const directions: Array<{ dir: 'left' | 'right' | 'top' | 'bottom'; expected: string }> = [
      { dir: 'left', expected: 'horizontal' },
      { dir: 'right', expected: 'horizontal' },
      { dir: 'top', expected: 'vertical' },
      { dir: 'bottom', expected: 'vertical' },
    ];

    for (const { dir, expected } of directions) {
      const singlePaneLayout: LayoutConfig = {
        panes: [
          {
            id: 'pane1',
            tabs: ['tab1', 'tab2'],
            activeTab: 'tab1',
          },
        ],
      };

      const twoTabs: TabData[] = [
        { id: 'tab1', title: 'Tab 1', content: <div>Content</div> },
        { id: 'tab2', title: 'Tab 2', content: <div>Content</div> },
      ];

      const TestComponent = () => {
        const { splitPane, rootNode } = useLayout();
        return (
          <div>
            <div data-testid="root-direction">{rootNode?.type === 'split' ? rootNode.direction : 'pane'}</div>
            <button
              data-testid="split-btn"
              onClick={() => splitPane('tab2', 'pane1', 'pane1', dir)}
            >
              Split {dir}
            </button>
          </div>
        );
      };

      const { unmount } = render(
        <LayoutProvider initialLayout={singlePaneLayout} initialTabs={twoTabs}>
          <TestComponent />
        </LayoutProvider>
      );

      // Initially it's a pane
      expect(screen.getByTestId('root-direction')).toHaveTextContent('pane');

      // Split
      fireEvent.click(screen.getByTestId('split-btn'));

      // Should create correct split direction
      await waitFor(() => {
        expect(screen.getByTestId('root-direction')).toHaveTextContent(expected);
      });

      unmount();
    }
  });

  it('single-child split auto-collapses after pane removal', async () => {
    const splitLayout: LayoutConfig = {
      root: {
        id: 'root',
        type: 'split',
        direction: 'horizontal',
        children: [
          {
            id: 'pane1',
            type: 'pane',
            tabs: ['tab1'],
            activeTab: 'tab1',
          },
          {
            id: 'pane2',
            type: 'pane',
            tabs: ['tab2'],
            activeTab: 'tab2',
          },
        ],
        sizes: [0.5, 0.5],
      },
    };

    const twoTabs: TabData[] = [
      { id: 'tab1', title: 'Tab 1', content: <div>Content</div> },
      { id: 'tab2', title: 'Tab 2', content: <div>Content</div> },
    ];

    const TestComponent = () => {
      const { removePane, rootNode } = useLayout();
      return (
        <div>
          <div data-testid="root-type">{rootNode?.type}</div>
          <button data-testid="remove-pane2" onClick={() => removePane('pane2')}>
            Remove Pane 2
          </button>
        </div>
      );
    };

    render(
      <LayoutProvider initialLayout={splitLayout} initialTabs={twoTabs}>
        <TestComponent />
      </LayoutProvider>
    );

    // Initially root is a split
    expect(screen.getByTestId('root-type')).toHaveTextContent('split');

    // Remove pane2
    fireEvent.click(screen.getByTestId('remove-pane2'));

    // Split should collapse to single pane
    await waitFor(() => {
      expect(screen.getByTestId('root-type')).toHaveTextContent('pane');
    });
  });

  it('layout serialization round-trip', () => {
    const complexLayout: LayoutConfig = {
      root: {
        id: 'root',
        type: 'split',
        direction: 'horizontal',
        children: [
          {
            id: 'left-pane',
            type: 'pane',
            tabs: ['tab1'],
            activeTab: 'tab1',
            minSize: 200,
            maxSize: 800,
          },
          {
            id: 'right-split',
            type: 'split',
            direction: 'vertical',
            children: [
              {
                id: 'top-right',
                type: 'pane',
                tabs: ['tab2'],
                activeTab: 'tab2',
              },
              {
                id: 'bottom-right',
                type: 'pane',
                tabs: ['tab3'],
                activeTab: 'tab3',
              },
            ],
            sizes: [0.6, 0.4],
          },
        ],
        sizes: [0.4, 0.6],
      },
      minSize: 100,
      maxSize: 1000,
    };

    const TestComponent = () => {
      const { rootNode } = useLayout();
      return (
        <div>
          <div data-testid="root-exists">{rootNode ? 'yes' : 'no'}</div>
          <div data-testid="child-count">{rootNode?.type === 'split' ? rootNode.children?.length : 0}</div>
        </div>
      );
    };

    render(
      <LayoutProvider initialLayout={complexLayout} initialTabs={mockTabs}>
        <TestComponent />
      </LayoutProvider>
    );

    // Layout should be properly parsed
    expect(screen.getByTestId('root-exists')).toHaveTextContent('yes');
    expect(screen.getByTestId('child-count')).toHaveTextContent('2');
  });

  it('tab data is preserved in context', () => {
    const tabsWithData: TabData[] = [
      {
        id: 'tab1',
        title: 'Tab 1',
        content: <div>Content</div>,
        data: { 
          filePath: '/src/components/App.tsx',
          language: 'typescript',
          modified: true,
          metadata: { version: 1 }
        },
      },
    ];

    const layout: LayoutConfig = {
      panes: [
        {
          id: 'pane1',
          tabs: ['tab1'],
          activeTab: 'tab1',
        },
      ],
    };

    const TestComponent = () => {
      const { tabs } = useLayout();
      const tab1 = tabs.get('tab1');
      return (
        <div>
          <div data-testid="has-data">{tab1?.data ? 'yes' : 'no'}</div>
          <div data-testid="file-path">{(tab1?.data as { filePath: string })?.filePath || 'none'}</div>
          <div data-testid="language">{(tab1?.data as { language: string })?.language || 'none'}</div>
          <div data-testid="modified">{String((tab1?.data as { modified: boolean })?.modified)}</div>
        </div>
      );
    };

    render(
      <LayoutProvider initialLayout={layout} initialTabs={tabsWithData}>
        <TestComponent />
      </LayoutProvider>
    );

    expect(screen.getByTestId('has-data')).toHaveTextContent('yes');
    expect(screen.getByTestId('file-path')).toHaveTextContent('/src/components/App.tsx');
    expect(screen.getByTestId('language')).toHaveTextContent('typescript');
    expect(screen.getByTestId('modified')).toHaveTextContent('true');
  });

  it('handles edge case: empty initial layout', () => {
    const emptyLayout: LayoutConfig = {
      panes: [],
    };

    const TestComponent = () => {
      const { rootNode, panes } = useLayout();
      return (
        <div>
          <div data-testid="root-type">{rootNode?.type || 'null'}</div>
          <div data-testid="pane-count">{panes.size}</div>
        </div>
      );
    };

    render(
      <LayoutProvider initialLayout={emptyLayout} initialTabs={[]}>
        <TestComponent />
      </LayoutProvider>
    );

    // Should create empty pane
    expect(screen.getByTestId('root-type')).toHaveTextContent('pane');
    expect(screen.getByTestId('pane-count')).toHaveTextContent('1');
  });

  it('handles edge case: single pane layout', () => {
    const singlePaneLayout: LayoutConfig = {
      panes: [
        {
          id: 'only-pane',
          tabs: ['tab1'],
          activeTab: 'tab1',
        },
      ],
    };

    const TestComponent = () => {
      const { rootNode, panes } = useLayout();
      return (
        <div>
          <div data-testid="root-type">{rootNode?.type}</div>
          <div data-testid="root-id">{rootNode?.id}</div>
          <div data-testid="pane-count">{panes.size}</div>
        </div>
      );
    };

    render(
      <LayoutProvider initialLayout={singlePaneLayout} initialTabs={[mockTabs[0]]}>
        <TestComponent />
      </LayoutProvider>
    );

    expect(screen.getByTestId('root-type')).toHaveTextContent('pane');
    expect(screen.getByTestId('root-id')).toHaveTextContent('only-pane');
    expect(screen.getByTestId('pane-count')).toHaveTextContent('1');
  });
});

// Helper component for Tab tests
const TabComponent = (props: { tab: TabData; isActive: boolean; onDragStart?: () => void; onDragEnd?: () => void; onClose?: () => void }) => {
  return <Tab {...props} />;
};
