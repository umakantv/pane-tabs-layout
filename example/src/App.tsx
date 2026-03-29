import { PaneTabsLayout, type TabData, type LayoutConfig } from 'pane-tabs-layout';
import { useState, useCallback } from 'react';
import './App.css';

// Sample content components
const ProblemContent = () => (
  <div className="content-panel">
    <h2>Two Sum</h2>
    <p>Given an array of integers <code>nums</code> and an integer <code>target</code>, return indices of the two numbers such that they add up to <code>target</code>.</p>
    <p>You may assume that each input would have exactly one solution, and you may not use the same element twice.</p>
    <h3>Example 1:</h3>
    <pre>{`Input: nums = [2,7,11,15], target = 9
Output: [0,1]
Explanation: Because nums[0] + nums[1] == 9, we return [0, 1].`}</pre>
  </div>
);

const CodeContent = () => (
  <div className="content-panel code-panel">
    <pre>{`function twoSum(nums, target) {
  const map = new Map();
  
  for (let i = 0; i < nums.length; i++) {
    const complement = target - nums[i];
    
    if (map.has(complement)) {
      return [map.get(complement), i];
    }
    
    map.set(nums[i], i);
  }
  
  return [];
}`}</pre>
  </div>
);

const ConsoleContent = () => (
  <div className="content-panel console-panel">
    <div className="console-line">
      <span className="console-prompt">&gt;</span>
      <span>Running test cases...</span>
    </div>
    <div className="console-line success">
      <span className="console-prompt">✓</span>
      <span>Test case 1 passed (2ms)</span>
    </div>
    <div className="console-line success">
      <span className="console-prompt">✓</span>
      <span>Test case 2 passed (1ms)</span>
    </div>
    <div className="console-line">
      <span className="console-prompt">&gt;</span>
      <span>All tests passed!</span>
    </div>
  </div>
);

const NotesContent = () => (
  <div className="content-panel">
    <h3>Notes</h3>
    <ul>
      <li>Use a hash map for O(n) time complexity</li>
      <li>Store complement as key, index as value</li>
      <li>Single pass solution</li>
    </ul>
  </div>
);

const TestCasesContent = () => (
  <div className="content-panel">
    <h3>Test Cases</h3>
    <div className="test-case">
      <strong>Input:</strong> nums = [2,7,11,15], target = 9<br/>
      <strong>Expected:</strong> [0,1]
    </div>
    <div className="test-case">
      <strong>Input:</strong> nums = [3,2,4], target = 6<br/>
      <strong>Expected:</strong> [1,2]
    </div>
  </div>
);

// Initial tabs data
const initialTabs: TabData[] = [
  {
    id: 'problem',
    title: 'Problem',
    content: <ProblemContent />,
    closable: false,
  },
  {
    id: 'code',
    title: 'Code',
    content: <CodeContent />,
    closable: false,
  },
  {
    id: 'console',
    title: 'Console',
    content: <ConsoleContent />,
    closable: true,
  },
  {
    id: 'notes',
    title: 'Notes',
    content: <NotesContent />,
    closable: true,
  },
  {
    id: 'tests',
    title: 'Test Cases',
    content: <TestCasesContent />,
    closable: true,
  },
];

// Initial layout configuration (legacy format - will be converted to tree internally)
const initialLayout: LayoutConfig = {
  vertical: false,
  defaultSizes: [400, 400],
  panes: [
    {
      id: 'left-pane',
      tabs: ['problem', 'code'],
      activeTab: 'problem',
      minSize: 200,
    },
    {
      id: 'right-pane',
      tabs: ['console', 'notes', 'tests'],
      activeTab: 'console',
      minSize: 200,
    },
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
        <p>Drag tabs to split panes! Try dragging to the edges of a pane.</p>
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
          <strong>Try it:</strong> Drag tabs between panes, or drag to the <strong>edges</strong> of a pane to create new splits!
          You can create complex layouts with multiple panes. Close tabs with the × button.
        </p>
      </footer>
    </div>
  );
}

export default App;