# React Component Boilerplate

This is a reusable boilerplate for publishing React components to npm. Extend this for new packages.

## Features

- TypeScript support
- Vite for fast builds (ESM + CJS)
- Vitest + React Testing Library for testing
- Ready for publishing to npm

## Installation

```sh
npm install pane-tabs-layout
```

## Usage

```tsx
import { HelloWorld } from 'pane-tabs-layout';

function App() {
  return <HelloWorld name=\"User\" />;
}
```

## Development Scripts

Update `package.json` scripts as needed:

- `npm test` - Run tests with Vitest
- `npm run build` - Build library to `dist/`
- `npm run dev` - Watch mode for development
- `npm run preview` - Preview built library

## Project Structure

```
.
├── src/
│   ├── HelloWorld.tsx     # Sample component
│   ├── index.ts           # Entry point
│   ├── HelloWorld.test.tsx # Tests
│   └── test-setup.ts      # Test setup
├── example/               # Demo Vite app to test the library
├── dist/                  # Built files (gitignored)
├── package.json
├── tsconfig.json
├── vite.config.ts
└── README.md
```

## Publishing

1. Update `name`, `version` in `package.json`
2. `npm run build`
3. `npm publish`

## Extending for New Packages

1. Clone this repo or copy structure
2. Rename package and component
3. Replace `HelloWorld` with your component
4. Update README
5. Add your tests
6. Build and publish