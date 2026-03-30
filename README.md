# Pane Tabs Layout

A production-ready React component library for creating sophisticated split-pane layouts with draggable tabs. Inspired by industry-leading IDEs like VS Code and LeetCode, it provides a powerful, flexible, and accessible workspace management solution. Built on top of the robust [allotment](https://github.com/johnwalley/allotment) library for smooth, performant pane resizing.

## Preview

![Preview Image](https://raw.githubusercontent.com/umakantv/pane-tabs-layout/refs/heads/main/assets/preview-1.png)

## ✨ Features

- 🪟 **Infinite Split Panes** - Create complex nested layouts by dragging tabs to any edge
- 🔄 **Intuitive Drag & Drop** - Move tabs between panes or split panes by dragging to edges
- 📊 **Tree-Based Layout** - Recursive layout structure supports unlimited nesting depth
- 🧹 **Auto-Cleanup** - Empty panes automatically collapse and remove themselves
- 📱 **Fully Responsive** - Panes intelligently adjust to container size changes
- 💾 **Persistent State** - Serialize and restore complete layout configurations
- 🎨 **Deeply Customizable** - Extensive CSS variables for complete theming control
- ♿ **Accessible** - Full ARIA support with keyboard navigation
- 🔗 **Link Interception** - Automatically open matching links as tabs with custom resolver
- 📝 **TypeScript First** - 100% TypeScript with comprehensive type definitions
- 🚀 **Production Ready** - Battle-tested with automated testing and strict type checking
- 🔲 **Maximize / Restore Panes** - Double-click the empty tab bar area or click the maximize/restore button (top-right of tab bar) to toggle a pane between normal and maximized (full viewport) states.## 📦 Installation

```sh
npm install pane-tabs-layout
# or
yarn add pane-tabs-layout
# or
pnpm add pane-tabs-layout
```

## 🚀 Quick Start

```tsx
import { PaneTabsLayout, TabData, LayoutConfig } from 'pane-tabs-layout';

const tabs: TabData[] = [
  {
    id: 'editor',
    title: 'Editor',
    content: <CodeEditor />,
    closable: false,
  },
  {
    id: 'console',
    title: 'Console',
    content: <ConsoleOutput />,
    closable: true,
    data: { runId: 'run-123', status: 'running' }, // Custom metadata
  },
];

const layout: LayoutConfig = {
  panes: [
    {
      id: 'main-pane',
      tabs: ['editor'],
      activeTab: 'editor',
      minSize: 300,
    },
    {
      id: 'bottom-pane',
      tabs: ['console'],
      activeTab: 'console',
      minSize: 150,
    },
  ],
  vertical: true,
  defaultSizes: [600, 200],
};

function App() {
  const [currentLayout, setCurrentLayout] = useState(layout);

  return (
    <PaneTabsLayout
      initialLayout={currentLayout}
      initialTabs={tabs}
      onLayoutChange={(newLayout) => {
        console.log('Layout changed:', newLayout);
        setCurrentLayout(newLayout);
        // Persist to localStorage, database, etc.
      }}
      onTabsChange={(newTabs) => {
        console.log('Tabs changed:', newTabs);
      }}
    />
  );
}
```

## 🎯 Core Concepts

### Multi-Pane Layouts with Drag-to-Split

Unlike traditional split-pane libraries limited to 2 panes, Pane Tabs Layout supports **unlimited nested splits**. Simply drag a tab to any edge of an existing pane:

- **Drag to center** → Move tab to existing pane
- **Drag to left/right edge** → Create horizontal split
- **Drag to top/bottom edge** → Create vertical split

The layout automatically manages the tree structure, collapsing unnecessary splits when panes are removed.

### Tab Data & Metadata

Attach any serializable data to tabs for dynamic content rendering:

```tsx
interface ConsoleData {
  runId: string;
  status: 'success' | 'failure' | 'running';
  startedAt: string;
}

const consoleTab: TabData = {
  id: 'console-1',
  title: 'Test Run #1',
  content: <ConsolePanel runId="run-123" status="success" />,
  data: {
    runId: 'run-123',
    status: 'success',
    startedAt: new Date().toISOString(),
  } as ConsoleData,
};

// Access tab data anywhere in your app
const { tabs } = useLayout();
const tabData = tabs.get('console-1')?.data as ConsoleData;
```

### Automatic Layout Optimization

The library intelligently manages the layout tree:

- **Empty pane removal**: When you move all tabs out of a pane, it automatically disappears
- **Split collapsing**: When a split has only one child, it collapses to avoid unnecessary nesting
- **Smart redistribution**: Pane sizes are evenly redistributed when panes are added or removed

## 📚 API Reference

### PaneTabsLayout

The root component that manages the entire layout system.

#### Props

| Prop | Type | Required | Description |
|------|------|----------|-------------|
| `initialLayout` | `LayoutConfig` | ✅ | Initial layout configuration |
| `initialTabs` | `TabData[]` | ✅ | Array of tab definitions |
| `onLayoutChange` | `(layout: LayoutConfig) => void` | ❌ | Called when layout structure changes (splits, pane removal, etc.) |
| `onTabsChange` | `(tabs: TabData[]) => void` | ❌ | Called when tabs are added, removed, or reordered |
| `onOpenLink` | `(url: string) => TabData \| null` | ❌ | Link resolver — return a `TabData` to open the URL as a tab, or `null` for default browser behavior |
| `linkInterception` | `'auto' \| 'manual' \| 'none'` | ❌ | Controls how `<a>` clicks inside content are intercepted (default: `'auto'`) |
| `className` | `string` | ❌ | Additional CSS class for the container |
| `style` | `React.CSSProperties` | ❌ | Inline styles for the container |

### TabData

Defines a tab's content, behavior, and associated metadata.

```typescript
interface TabData {
  /** Unique identifier for the tab */
  id: string;
  /** Display title in the tab bar */
  title: string;
  /** Optional icon (ReactNode) */
  icon?: ReactNode;
  /** Content rendered when tab is active */
  content: ReactNode;
  /** Allow closing the tab (default: true) */
  closable?: boolean;
  /** Allow dragging the tab (default: true) */
  draggable?: boolean;
  /** Custom data attached to the tab */
  data?: Record<string, unknown>;
}
```

### LayoutConfig

Configuration for the entire layout structure.

```typescript
interface LayoutConfig {
  /** Legacy flat pane configuration (for simple 2-pane layouts) */
  panes?: PaneConfig[];
  /** Tree-based layout structure (for complex nested layouts) */
  root?: LayoutNode;
  /** Initial pane sizes in pixels */
  defaultSizes?: number[];
  /** Legacy: vertical split orientation */
  vertical?: boolean;
  /** Minimum pane size in pixels */
  minSize?: number;
  /** Maximum pane size in pixels */
  maxSize?: number;
}
```

### LayoutNode (Tree Structure)

For advanced use cases, you can define layouts as a recursive tree:

```typescript
interface LayoutNode {
  id: string;
  type: 'pane' | 'split';
  // For split nodes
  direction?: 'horizontal' | 'vertical';
  children?: LayoutNode[];
  sizes?: number[]; // Proportional sizes (sum to 1)
  // For pane nodes
  tabs?: string[];
  activeTab?: string;
  minSize?: number;
  maxSize?: number;
  visible?: boolean;
}
```

## 🎨 Theming

Pane Tabs Layout uses CSS custom properties for complete visual customization:

### Complete CSS Variable Reference

```css
:root {
  /* Background Colors */
  --ptl-bg-color: #1e1e1e;
  --ptl-tab-bar-bg: #252526;
  --ptl-tab-bg: #2d2d2d;
  --ptl-tab-hover-bg: #2a2d2e;
  --ptl-tab-active-bg: #1e1e1e;
  
  /* Text Colors */
  --ptl-text-color: #cccccc;
  --ptl-tab-text: #969696;
  --ptl-tab-hover-text: #cccccc;
  --ptl-tab-active-text: #ffffff;
  
  /* Borders */
  --ptl-border-color: #3c3c3c;
  --ptl-tab-active-border: #007acc;
  
  /* Drag & Drop */
  --ptl-drag-over-bg: rgba(0, 122, 204, 0.1);
  --ptl-drop-indicator-color: #007acc;
  --ptl-drop-zone-bg: rgba(0, 122, 204, 0.2);
  --ptl-drop-zone-border: #007acc;
  --ptl-drop-zone-label-bg: rgba(0, 122, 204, 0.9);
  
  /* Close Button */
  --ptl-close-hover-bg: #c75450;
  --ptl-close-hover-text: #ffffff;
  
  /* Scrollbar */
  --ptl-scrollbar-thumb: #424242;
  
  /* Content */
  --ptl-content-padding: 0;
  --ptl-empty-state-color: #6e6e6e;
}
```

### Light Theme Example

```css
[data-theme="light"] {
  --ptl-bg-color: #ffffff;
  --ptl-tab-bar-bg: #f3f3f3;
  --ptl-tab-bg: #ececec;
  --ptl-tab-hover-bg: #e8e8e8;
  --ptl-tab-active-bg: #ffffff;
  --ptl-text-color: #333333;
  --ptl-tab-text: #666666;
  --ptl-tab-active-text: #333333;
  --ptl-border-color: #e0e0e0;
  --ptl-drag-over-bg: rgba(0, 122, 204, 0.05);
  --ptl-scrollbar-thumb: #c1c1c1;
}
```

## 🔗 Link Handling

Pane Tabs Layout can intercept `<a>` clicks inside tab content and open matching URLs as new tabs — no changes needed to your content components. You provide a resolver function that decides which URLs become tabs.

### Basic Setup

```tsx
import { PaneTabsLayout, type TabData } from 'pane-tabs-layout';

function App() {
  // You have full control over matching. Return TabData to open as a tab, null to ignore.
  const handleOpenLink = useCallback((url: string): TabData | null => {
    // Handle /problem/{id} links
    const problemMatch = url.match(/\/problem\/(\w+)$/);
    if (problemMatch) {
      const problemId = problemMatch[1];
      return {
        id: `problem-${problemId}`,
        title: `Problem ${problemId}`,
        content: <ProblemView id={problemId} />,
        closable: true,
        data: { problemId },
      };
    }
    // Not handled — browser navigates normally
    return null;
  }, []);

  return (
    <PaneTabsLayout
      initialLayout={layout}
      initialTabs={tabs}
      onOpenLink={handleOpenLink}
    />
  );
}
```

Now any `<a href="https://example.com/problem/123">` inside your tab content automatically opens a "Problem 123" tab instead of navigating.

### How It Works

1. **Event Delegation** — A single click handler on each pane's content area catches all `<a>` clicks via bubbling.
2. **Your Resolver Runs** — The clicked link's `href` is passed to your `onOpenLink` callback.
3. **Tab Created or Activated** — If you return a `TabData`, the library either creates a new tab or activates an existing one with the same `id` (built-in deduplication).
4. **Or Ignored** — If you return `null`, `preventDefault` is not called and the browser handles the click normally.

### Link Interception Modes

Control the behavior with the `linkInterception` prop:

| Mode | Behavior |
|------|----------|
| `'auto'` (default) | All `<a>` clicks inside pane content are intercepted and resolved via `onOpenLink` |
| `'manual'` | Only the `<PaneLink>` component and programmatic `openLink()` calls trigger resolution |
| `'none'` | No link interception at all |

### Escape Hatch: `data-ptl-external`

Add `data-ptl-external` to any `<a>` to skip interception, even in `'auto'` mode:

```html
<a href="https://google.com" data-ptl-external>Opens normally</a>
```

### PaneLink Component

For explicit, opt-in link handling (useful in `'manual'` mode or when targeting a specific pane):

```tsx
import { PaneLink } from 'pane-tabs-layout';

const MyContent = () => (
  <div>
    {/* Uses onOpenLink resolver, opens tab in the specified pane */}
    <PaneLink href="/problem/456" paneId="right-pane">Problem 456</PaneLink>

    {/* Works like a normal <a> if onOpenLink returns null */}
    <PaneLink href="https://external.com">External</PaneLink>
  </div>
);
```

### Programmatic Navigation

Use `openLink()` from the `useLayout` hook to open links from code:

```tsx
import { useLayout } from 'pane-tabs-layout';

function Toolbar() {
  const { openLink } = useLayout();

  return (
    <button onClick={() => openLink('https://example.com/problem/42', 'left-pane')}>
      Open Problem 42
    </button>
  );
}
```

## 🔧 Advanced Usage

### Hook: useLayout

Access the layout context for programmatic control:

```tsx
import { useLayout } from 'pane-tabs-layout';

function MyComponent() {
  const { 
    tabs,           // Map of all tabs
    panes,          // Map of all panes
    rootNode,       // Root layout node
    moveTab,        // Move tab between panes
    splitPane,      // Programmatically split a pane
    activateTab,    // Set active tab
    closeTab,       // Close a tab
    addTab,         // Add new tab to pane
    removePane,     // Remove a pane
    maximizePane,   // Toggle pane maximize/restore
    openLink,       // Open a URL as a tab (uses onOpenLink resolver)
  } = useLayout();
  
// Example: Toggle pane maximize
  const handleMaximize = (paneId: string) => {
    maximizePane(paneId);
  };
  
  // Example: Add a new tab programmatically
  const handleAddTab = () => {
    addTab('left-pane', {
      id: 'new-tab',
      title: 'New Tab',
      content: <NewContent />,
    });
  };
  
  return <button onClick={handleAddTab}>Add Tab</button>;
}
```

### Persisting Layout State

Save and restore user layouts:

```tsx
function App() {
  const [layout, setLayout] = useState(() => {
    // Restore from localStorage
    const saved = localStorage.getItem('app-layout');
    return saved ? JSON.parse(saved) : defaultLayout;
  });

  const handleLayoutChange = useCallback((newLayout) => {
    setLayout(newLayout);
    // Persist to localStorage
    localStorage.setItem('app-layout', JSON.stringify(newLayout));
  }, []);

  return (
    <PaneTabsLayout
      initialLayout={layout}
      initialTabs={tabs}
      onLayoutChange={handleLayoutChange}
    />
  );
}
```

## 🧪 Development

```sh
# Install dependencies
npm install

# Run tests
npm test

# Build library
npm run build

# Type checking
npm run type-check

# Development mode with watch
npm run dev
```

## 📁 Project Structure

```
pane-tabs-layout/
├── src/
│   ├── PaneTabsLayout.tsx    # Main layout component with recursive rendering
│   ├── Pane.tsx               # Individual pane with drop zone detection & link interception
│   ├── Tab.tsx                # Tab component with drag support
│   ├── PaneLink.tsx           # Explicit link component for tab-aware navigation
│   ├── LayoutContext.tsx      # React context with tree management & openLink
│   ├── types.ts               # Complete TypeScript definitions
│   ├── styles.css             # Production-ready styles
│   └── index.ts               # Public API exports
├── example/                   # Full-featured demo application
├── dist/                      # Built library files
└── package.json
```

## 📄 License

ISC © [umakantv](https://github.com/umakantv)
