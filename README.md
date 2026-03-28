# Pane Tabs Layout

A React component library for creating split pane layouts with draggable tabs, similar to LeetCode and VS Code. Built on top of the powerful [allotment](https://github.com/johnwalley/allotment) library for resizable panes.

## Features

- 🪟 **Split Pane Layouts** - Create horizontal or vertical resizable pane layouts
- 🔄 **Draggable Tabs** - Drag and drop tabs between panes
- 📱 **Responsive** - Panes automatically adjust to container size
- 🎨 **Customizable** - CSS variables for easy theming
- ♿ **Accessible** - ARIA attributes for screen readers
- 📝 **TypeScript** - Full TypeScript support

## Installation

```sh
npm install pane-tabs-layout
```

## Usage

```tsx
import { PaneTabsLayout, TabData, LayoutConfig } from 'pane-tabs-layout';

const tabs: TabData[] = [
  {
    id: 'problem',
    title: 'Problem',
    content: <div>Problem description here</div>,
  },
  {
    id: 'code',
    title: 'Code',
    content: <div>Code editor here</div>,
  },
  {
    id: 'console',
    title: 'Console',
    content: <div>Console output here</div>,
    closable: true,
  },
];

const layout: LayoutConfig = {
  panes: [
    {
      id: 'left-pane',
      tabs: ['problem', 'code'],
      activeTab: 'problem',
      minSize: 200,
    },
    {
      id: 'right-pane',
      tabs: ['console'],
      activeTab: 'console',
      minSize: 200,
    },
  ],
  defaultSizes: [400, 400],
};

function App() {
  return (
    <PaneTabsLayout
      initialLayout={layout}
      initialTabs={tabs}
      onLayoutChange={(newLayout) => console.log('Layout changed:', newLayout)}
    />
  );
}
```

## API

### PaneTabsLayout

The main component that renders the split pane layout with tabs.

#### Props

| Prop | Type | Description |
|------|------|-------------|
| `initialLayout` | `LayoutConfig` | Initial layout configuration |
| `initialTabs` | `TabData[]` | Array of tab data |
| `onLayoutChange` | `(layout: LayoutConfig) => void` | Callback when layout changes |
| `onTabsChange` | `(tabs: TabData[]) => void` | Callback when tabs change |
| `className` | `string` | Additional CSS class |
| `style` | `React.CSSProperties` | Inline styles |

### TabData

```typescript
interface TabData {
  id: string;                    // Unique identifier
  title: string;                 // Display title
  icon?: ReactNode;              // Optional icon
  content: ReactNode;            // Tab content
  closable?: boolean;            // Can be closed (default: true)
  draggable?: boolean;           // Can be dragged (default: true)
  data?: Record<string, unknown>; // Additional data
}
```

### LayoutConfig

```typescript
interface LayoutConfig {
  panes: PaneConfig[];           // Array of pane configurations
  defaultSizes?: number[];       // Initial pane sizes
  vertical?: boolean;            // Vertical layout (default: false)
  minSize?: number;              // Minimum pane size
  maxSize?: number;              // Maximum pane size
}
```

### PaneConfig

```typescript
interface PaneConfig {
  id: string;                    // Unique identifier
  tabs: string[];                // Array of tab IDs
  activeTab?: string;            // Currently active tab ID
  minSize?: number;              // Minimum size in pixels
  maxSize?: number;              // Maximum size in pixels
  preferredSize?: number | string; // Preferred size (px or %)
  snap?: boolean;                // Snap to zero size
}
```

## Theming

The component uses CSS variables for easy theming:

### Dark Theme (Default)

```css
:root {
  --ptl-bg-color: #1e1e1e;
  --ptl-tab-bar-bg: #252526;
  --ptl-tab-bg: #2d2d2d;
  --ptl-tab-active-bg: #1e1e1e;
  --ptl-tab-text: #969696;
  --ptl-tab-active-text: #ffffff;
  --ptl-border-color: #3c3c3c;
  --ptl-tab-active-border: #007acc;
}
```

### Light Theme

Add `data-theme="light"` to your HTML element or override the CSS variables:

```css
[data-theme="light"] {
  --ptl-bg-color: #ffffff;
  --ptl-tab-bar-bg: #f3f3f3;
  --ptl-tab-bg: #ececec;
  --ptl-tab-active-bg: #ffffff;
  --ptl-tab-text: #666666;
  --ptl-tab-active-text: #333333;
  --ptl-border-color: #e0e0e0;
}
```

## Development Scripts

- `npm test` - Run tests with Vitest
- `npm run build` - Build library to `dist/`
- `npm run dev` - Watch mode for development
- `npm run type-check` - Run TypeScript type checking

## Project Structure

```
.
├── src/
│   ├── PaneTabsLayout.tsx   # Main component
│   ├── Pane.tsx             # Pane component
│   ├── Tab.tsx              # Tab component
│   ├── LayoutContext.tsx    # React context for state management
│   ├── types.ts             # TypeScript types
│   ├── styles.css           # Component styles
│   └── index.ts             # Entry point
├── example/                 # Demo Vite app
├── dist/                    # Built files (gitignored)
├── package.json
├── tsconfig.json
├── vite.config.ts
└── README.md
```

## Publishing

1. Update `version` in `package.json`
2. `npm run build`
3. `npm publish`

## License

ISC
