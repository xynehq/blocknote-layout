# Contributing to BlockNote Layout

Thank you for your interest in contributing! 🎉

## 📋 Getting Started

1. **Fork the repository** and clone your fork
2. **Install dependencies** (pnpm workspace):
   ```bash
   pnpm install
   ```
3. **Build all packages**:
   ```bash
   pnpm -r build
   ```

## 🏗️ Project Structure

This is a pnpm workspace — every block is its own npm package:

```
blocknote-layout/
├── packages/
│   ├── blocknote-layout/ # Umbrella package re-exporting all blocks
│   ├── core/             # Shared utilities (blocknote-layout-core)
│   ├── coderunner/       # Code runner block
│   ├── genius/           # Genius AI block
│   ├── mentions/         # Mention inline content
│   ├── slideshow/        # Slideshow presentations
│   └── whiteboard/       # Whiteboard block
├── .github/workflows/    # CI/CD pipelines
├── pnpm-workspace.yaml
└── package.json
```

Each package under `packages/` has its own `lib/` sources, `vite.config.ts`, and `package.json`.

## 🔧 Development Workflow

### Making Changes

1. Create a feature branch:
   ```bash
   git checkout -b feature/my-awesome-feature
   ```

2. Make your changes in the relevant `packages/<block>/lib/`

3. Build to check for errors:
   ```bash
   pnpm -r build
   ```

4. Commit your changes with a clear message:
   ```bash
   git commit -m "feat: improve code runner error handling"
   ```

### Commit Message Convention

We follow [Conventional Commits](https://www.conventionalcommits.org/):

- `feat: description` - New feature
- `fix: description` - Bug fix
- `docs: description` - Documentation changes
- `refactor: description` - Code refactoring
- `chore: description` - Maintenance tasks

## 📦 Releasing

Releases are handled automatically via GitHub Actions when a version tag is pushed.

### To release:

Versions are kept in lockstep — every package under `packages/` shares the same version.

1. Update the version in every `packages/*/package.json`:
   ```bash
   pnpm -r exec npm version 3.1.0 --no-git-tag-version
   ```

2. Commit the version bump:
   ```bash
   git commit -am "chore: bump version to 3.1.0"
   ```

3. Create and push a tag:
   ```bash
   git tag v3.1.0
   git push origin main --tags
   ```

4. The GitHub Action will automatically build and publish all packages to npm.

## 📝 Pull Request Process

1. Ensure your code builds without errors
2. Update documentation if needed
3. Create a pull request with a clear description
4. Wait for CI checks to pass
5. Request review from maintainers

## 🐛 Reporting Issues

Please use GitHub Issues to report bugs or request features. Include:

- Which package (e.g. `blocknote-layout-coderunner`)
- Version number
- Steps to reproduce
- Expected vs actual behavior

## 📄 License

By contributing, you agree that your contributions will be licensed under the MIT License.
