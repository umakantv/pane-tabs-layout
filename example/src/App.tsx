import { HelloWorld } from 'pane-tabs-layout';

function App() {
  return (
    <div style={{ padding: '2rem' }}>
      <h1>pane-tabs-layout Boilerplate Example</h1>
      <HelloWorld />
      <HelloWorld name="User" />
      <p>
        Edit <code>../src/HelloWorld.tsx</code> and run <code>npm run dev</code> in root to see HMR in example!
      </p>
    </div>
  );
}

export default App;