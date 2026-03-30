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
    
    <h3>Related Problems</h3>
    <ul>
      <li><a href="/problem/2">Add Two Numbers</a> — Linked lists</li>
      <li><a href="/problem/15">3Sum</a> — Array, Two Pointers</li>
      <li><a href="/problem/167">Two Sum II</a> — Sorted array</li>
    </ul>
    <p style={{ fontSize: '0.9em', color: '#666' }}>
      💡 Click the links above to open them as new tabs! This demonstrates the <code>onOpenLink</code> feature.
    </p>
  </div>
);

// Dynamic problem content for tabs opened via onOpenLink
interface DynamicProblemProps {
  problemId: string;
}
const DynamicProblemContent = ({ problemId }: DynamicProblemProps) => {
  const problemTitles: Record<string, string> = {
    '2': 'Add Two Numbers',
    '15': '3Sum',
    '167': 'Two Sum II',
  };
  const title = problemTitles[problemId] || `Problem ${problemId}`;
  
  return (
    <div className="content-panel">
      <h2>{title}</h2>
      <p>This tab was dynamically opened via <code>onOpenLink</code> with problemId: <strong>{problemId}</strong>.</p>
      <p>Tab ID: <code>problem-{problemId}</code></p>
      <p style={{ fontSize: '0.9em', color: '#666' }}>
        Try closing this tab and clicking the link again from the Two Sum problem to see it reopen!
      </p>
    </div>
  );
};

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

// Console data type for tab data
interface ConsoleData {
  runId: string;
  status: 'success' | 'failure' | 'running';
  startedAt: string;
  completedAt?: string;
}

// Dynamic console content that receives data via props
const ConsoleContent = ({ runId, status, startedAt, completedAt }: ConsoleData) => {
  const isSuccess = status === 'success';
  const isFailure = status === 'failure';
  
  return (
    <div className="content-panel console-panel">
      <div className="console-line">
        <span className="console-prompt">&gt;</span>
        <span>Run ID: {runId}</span>
      </div>
      <div className="console-line">
        <span className="console-prompt">&gt;</span>
        <span>Started: {new Date(startedAt).toLocaleTimeString()}</span>
      </div>
      {completedAt && (
        <div className="console-line">
          <span className="console-prompt">&gt;</span>
          <span>Completed: {new Date(completedAt).toLocaleTimeString()}</span>
        </div>
      )}
      <div className="console-line">
        <span className="console-prompt">&gt;</span>
        <span>Status: {status.toUpperCase()}</span>
      </div>
      <div className="console-line">
        <span className="console-prompt">&gt;</span>
        <span>Running test cases...</span>
      </div>
      {isSuccess && (
        <>
          <div className="console-line success">
            <span className="console-prompt">✓</span>
            <span>Test case 1 passed (2ms)</span>
          </div>
          <div className="console-line success">
            <span className="console-prompt">✓</span>
            <span>Test case 2 passed (1ms)</span>
          </div>
          <div className="console-line success">
            <span className="console-prompt">✓</span>
            <span>All tests passed!</span>
          </div>
        </>
      )}
      {isFailure && (
        <>
          <div className="console-line error">
            <span className="console-prompt">✗</span>
            <span>Test case 1 failed (2ms)</span>
          </div>
          <div className="console-line error">
            <span className="console-prompt">✗</span>
            <span>Error: Expected [0,1] but got [1,0]</span>
          </div>
          <div className="console-line">
            <span className="console-prompt">&gt;</span>
            <span>2 tests failed, 0 passed</span>
          </div>
        </>
      )}
    </div>
  );
};

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

// Initial tabs data with console tabs having different data
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
    id: 'console-success',
    title: 'Console (Success)',
    content: (
      <ConsoleContent
        runId="run-success-001"
        status="success"
        startedAt="2024-01-15T10:30:00Z"
        completedAt="2024-01-15T10:30:05Z"
      />
    ),
    closable: true,
    data: {
      runId: 'run-success-001',
      status: 'success',
      jobType: 'test',
    } as ConsoleData,
  },
  {
    id: 'console-failure',
    title: 'Console (Failure)',
    content: (
      <ConsoleContent
        runId="run-failure-002"
        status="failure"
        startedAt="2024-01-15T10:35:00Z"
        completedAt="2024-01-15T10:35:03Z"
      />
    ),
    closable: true,
    data: {
      runId: 'run-failure-002',
      status: 'failure',
      jobType: 'test',
    } as ConsoleData,
  },
  {
    id: 'notes',
    title: 'Notes',
    content: <NotesContent />,
    closable: true,
    data: {
      noteId: 'note-123',
      author: 'john_doe',
      createdAt: '2024-01-15',
    },
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
      tabs: ['console-success', 'console-failure', 'notes', 'tests'],
      activeTab: 'console-success',
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

  const handleOpenLink = useCallback((url: string): TabData | null => {
    // Handle /problem/{id} links
    const problemMatch = url.match(/\/problem\/(\w+)$/);
    if (problemMatch) {
      const problemId = problemMatch[1];
      return {
        id: `problem-${problemId}`,
        title: `Problem ${problemId}`,
        content: <DynamicProblemContent problemId={problemId} />,
        closable: true,
        data: { problemId },
      };
    }
    // Not a handled URL — return null to let default browser behavior happen
    return null;
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
          onOpenLink={handleOpenLink}
          className="demo-layout"
        />
      </main>
      
      <footer className="app-footer">
        <p>
          <strong>Try it:</strong> Drag tabs between panes, or drag to the <strong>edges</strong> of a pane to create new splits!
          You can create complex layouts with multiple panes. Close tabs with the × button.
        </p>
        <p>
          <strong>✨ New:</strong> Click links in the <strong>Problem</strong> tab (like "Add Two Numbers") to open them as new tabs dynamically via <code>onOpenLink</code>!
        </p>
      </footer>
    </div>
  );
}

export default App;