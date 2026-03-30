# Contributing to Pane Tabs Layout

Thank you for your interest in contributing! 🎉

## Development Workflow

1. **Fork** the repo & clone **your fork**
2. **Install** dependencies:
   ```
   npm ci
   ```
3. **Run** the example app:
   ```
   cd example
   npm install
   npm run dev
   ```
4. **Test** your changes:
   ```
   npm test
   ```
5. **Build** the library:
   ```
   npm run build
   ```
6. **Commit** using [Conventional Commits](https://www.conventionalcommits.org/en/v1.0.0/):
   ```
   git commit -m \"feat(pane): add maximize animation\"
   ```
7. **Push** and create a **Pull Request**

## Scripts

| Script | Description |
|--------|-------------|
| `npm test` | Run tests with coverage |
| `npm run build` | Build library for production |
| `npm run type-check` | TypeScript type checking |
| `npm run dev` | Development mode (build + example) |

## CI/CD

- Tests run on every PR/push
- Coverage report commented on PRs via Codecov
- Build artifacts published on merge to main

## Code Style

- ESLint & Prettier enforced
- TypeScript strict mode
- Vitest for unit tests

Happy hacking! 🚀