import { PaneTabsLayout, type TabData, type LayoutConfig } from 'pane-tabs-layout';
import { useState, useCallback } from 'react';
import './App.css';

// ============================================
// Row 1: Code Editor + Markdown Preview (2 cols)
// ============================================
const CodeEditorContent = () => (
  <div className="content-panel code-panel">
    <div className="panel-header">📝 code.ts</div>
    <pre>{`interface User {
  id: number;
  name: string;
  email: string;
}

function getUser(id: number): Promise<User> {
  return fetch(\`/api/users/\${id}\`)
    .then(res => res.json());
}

const user = await getUser(42);
console.log(user.name); // "Alice"`}</pre>
  </div>
);

const MarkdownPreviewContent = () => (
  <div className="content-panel markdown-panel">
    <div className="panel-header">👁️ Preview</div>
    <h2>Documentation</h2>
    <p>Welcome to <strong>PaneTabsLayout</strong> — a flexible split-pane layout with draggable tabs.</p>
    <h3>Features</h3>
    <ul>
      <li>🪟 Split panes horizontally or vertically</li>
      <li>🔄 Drag tabs between panes</li>
      <li>📱 Fully responsive</li>
      <li>🎨 Customizable themes</li>
    </ul>
    <blockquote>Drag tabs to edges to create new panes!</blockquote>
  </div>
);

// ============================================
// Row 2: YAML Editors (3 cols)
// ============================================
const YamlEditor1 = () => (
  <div className="content-panel yaml-panel">
    <div className="panel-header">📄 docker-compose.yml</div>
    <pre>{`version: '3.8'
services:
  web:
    image: nginx:latest
    ports:
      - "80:80"
  db:
    image: postgres:14
    environment:
      POSTGRES_DB: app`}</pre>
  </div>
);

const YamlEditor2 = () => (
  <div className="content-panel yaml-panel">
    <div className="panel-header">📄 k8s-deployment.yaml</div>
    <pre>{`apiVersion: apps/v1
kind: Deployment
metadata:
  name: my-app
spec:
  replicas: 3
  selector:
    matchLabels:
      app: my-app
  template:
    spec:
      containers:
        - name: app
          image: myapp:v1`}</pre>
  </div>
);

const YamlEditor3 = () => (
  <div className="content-panel yaml-panel">
    <div className="panel-header">📄 workflow.yml</div>
    <pre>{`name: CI
on: [push]
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - run: npm test
      - run: npm run build`}</pre>
  </div>
);

// ============================================
// Row 3: Terminal (1 col)
// ============================================
const TerminalContent = () => (
  <div className="content-panel terminal-panel">
    <div className="panel-header">💻 Terminal</div>
    <div className="console-line"><span className="console-prompt">$</span> npm run dev</div>
    <div className="console-line success"><span className="console-prompt">✓</span> Vite dev server running on http://localhost:5173</div>
    <div className="console-line"><span className="console-prompt">$</span> git status</div>
    <div className="console-line muted">On branch main • 2 changes</div>
    <div className="console-line"><span className="console-prompt">$</span> <span className="cursor">█</span></div>
  </div>
);

// ============================================
// Outer layout: 3 vertical rows (panes), each with their own tabs
// ============================================
const initialTabs: TabData[] = [
  // Row 1: Code Editor + Markdown Preview (2 tabs)
  { id: 'code-editor', title: 'Code', content: <CodeEditorContent /> },
  { id: 'markdown-preview', title: 'Preview', content: <MarkdownPreviewContent /> },
  // Row 2: YAML Editors (3 tabs)
  { id: 'yaml1', title: 'docker-compose.yml', content: <YamlEditor1 /> },
  { id: 'yaml2', title: 'k8s-deployment.yaml', content: <YamlEditor2 /> },
  { id: 'yaml3', title: 'workflow.yml', content: <YamlEditor3 /> },
  // Row 3: Terminal (1 tab)
  { id: 'terminal', title: 'Terminal', content: <TerminalContent /> },
];

const initialLayout: LayoutConfig = {
  vertical: true,
  defaultSizes: [1, 1, 1],
  panes: [
    // Row 1: 2 tabs (Code + Preview)
    { id: 'row-1', tabs: ['code-editor', 'markdown-preview'], activeTab: 'code-editor', minSize: 180 },
    // Row 2: 3 tabs (YAML files)
    { id: 'row-2', tabs: ['yaml1', 'yaml2', 'yaml3'], activeTab: 'yaml1', minSize: 180 },
    // Row 3: 1 tab (Terminal)
    { id: 'row-3', tabs: ['terminal'], activeTab: 'terminal', minSize: 120 },
  ],
};

function App() {
  const [layout, setLayout] = useState<LayoutConfig>(initialLayout);

  const handleLayoutChange = useCallback((newLayout: LayoutConfig) => {
    console.log('Layout changed:', newLayout);
    setLayout(newLayout);
  }, []);

  return (
    <div className="app-container">
      <header className="app-header">
        <h1>🚀 Pane Tabs Layout Demo</h1>
        <p>3 rows: Code+Preview (2 tabs) • YAML Editors (3 tabs) • Terminal (1 tab)</p>
      </header>
      
      <main className="app-main">
        <PaneTabsLayout
          initialLayout={layout}
          initialTabs={initialTabs}
          onLayoutChange={handleLayoutChange}
          className="demo-layout"
        />
      </main>
      
      <footer className="app-footer">
        <p>
          <strong>Try it:</strong> Drag tabs between panes or to edges to create new splits. 
          Switch tabs within each row. Close tabs with ×. Resize by dragging dividers.
        </p>
      </footer>
    </div>
  );
}

export default App;