import { PaneTabsLayout, PaneLink, type TabData, type LayoutConfig } from 'pane-tabs-layout';
import { useState, useCallback } from 'react';
import './App.css';

// ---------- Dynamic content components for link-opened tabs ----------

const DynamicProblemContent = ({ problemId }: { problemId: string }) => (
  <div className="content-panel">
    <h2>Problem {problemId}</h2>
    <p>This tab was dynamically created for problem <strong>{problemId}</strong> via link interception.</p>
    <p>The content here would normally be fetched from an API using the problem ID.</p>
    <h3>Related problems:</h3>
    <ul>
      <li><a href={`https://example.com/problem/${Number(problemId) + 1}`}>Problem {Number(problemId) + 1}</a> (auto-intercepted link)</li>
      <li><PaneLink href={`https://example.com/problem/${Number(problemId) + 2}`}>Problem {Number(problemId) + 2}</PaneLink> (PaneLink component)</li>
      <li><a href="https://google.com" data-ptl-external>Google</a> (external — data-ptl-external, opens normally)</li>
    </ul>
  </div>
);

const DynamicConsoleContent = ({ runId }: { runId: string }) => (
  <div className="content-panel console-panel">
    <div className="console-line">
      <span className="console-prompt">&gt;</span>
      <span>Run ID: {runId}</span>
    </div>
    <div className="console-line">
      <span className="console-prompt">&gt;</span>
      <span>This console tab was opened via link interception.</span>
    </div>
    <div className="console-line success">
      <span className="console-prompt">✓</span>
      <span>Run data would be fetched from API for run {runId}.</span>
    </div>
  </div>
);

// ---------- Static content components ----------

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
    <h3>🔗 Link Interception Demo:</h3>
    <p>Click these links — they open as new tabs instead of navigating away:</p>
    <ul>
      <li><a href="https://example.com/problem/42">Problem 42</a> — auto-intercepted regular {'<a>'} tag</li>
      <li><a href="https://example.com/problem/99">Problem 99</a> — another auto-intercepted link</li>
      <li><a href="https://example.com/console/run-789">Console run-789</a> — opens a console tab</li>
      <li><PaneLink href="https://example.com/problem/7">Problem 7 (PaneLink)</PaneLink> — explicit PaneLink component</li>
      <li><a href="https://google.com" data-ptl-external>Google (external)</a> — has data-ptl-external, opens normally</li>
      <li><a href="https://unmatched.example.com/unknown">Unknown link</a> — no match, opens normally</li>
    </ul>
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

  /**
   * Link resolver: the user has full control over URL matching and tab creation.
   * Return a TabData to open it as a tab, or null to let the browser handle it.
   */
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

    // Handle /console/{runId} links
    const consoleMatch = url.match(/\/console\/([\w-]+)$/);
    if (consoleMatch) {
      const runId = consoleMatch[1];
      return {
        id: `console-${runId}`,
        title: `Console ${runId}`,
        content: <DynamicConsoleContent runId={runId} />,
        closable: true,
        data: { runId },
      };
    }

    // Not a handled URL — return null to let default browser behavior happen
    return null;
  }, []);

  return (
    <div className="app-container">
      <header className="app-header">
        <h1>🚀 Pane Tabs Layout Demo</h1>
        <p>Drag tabs to split panes! Try dragging to the edges of a pane. Click links inside tabs to open new tabs!</p>
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
          Click links in the Problem tab to open new tabs dynamically. Close tabs with the × button.
        </p>
      </footer>
    </div>
  );
}

export default App;