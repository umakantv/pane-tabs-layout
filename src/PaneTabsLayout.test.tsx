import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { PaneTabsLayout } from './PaneTabsLayout';
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
});
