# Contributing to BlockNote Layout

Thank you for your interest in contributing! 🎉

## 📋 Getting Started

1. **Fork the repository** and clone your fork
2. **Install dependencies**:
   ```bash
   npm install
   ```
3. **Start development server**:
   ```bash
   npm run dev
   ```

## 🏗️ Project Structure

```
blocknote-layout/
├── lib/
│   ├── main.ts           # Unified exports
│   └── coderunner/       # Python code runner plugin
│       ├── main.ts
│       ├── CodeBlock.tsx
│       └── pyodide.ts
├── .github/workflows/    # CI/CD pipelines
├── package.json
├── vite.config.ts
└── tsconfig.json
```

## 🔧 Development Workflow

### Making Changes

1. Create a feature branch:
   ```bash
   git checkout -b feature/my-awesome-feature
   ```

2. Make your changes in `lib/`

3. Build to check for errors:
   ```bash
   npm run build
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

1. Update the version in `package.json`:
   ```json
   {
     "version": "1.1.0"
   }
   ```

2. Commit the version bump:
   ```bash
   git commit -m "chore: bump version to 1.1.0"
   ```

3. Create and push a tag:
   ```bash
   git tag v1.1.0
   git push origin main --tags
   ```

4. The GitHub Action will automatically build and publish to npm.

## 📝 Pull Request Process

1. Ensure your code builds without errors
2. Update documentation if needed
3. Create a pull request with a clear description
4. Wait for CI checks to pass
5. Request review from maintainers

## 🐛 Reporting Issues

Please use GitHub Issues to report bugs or request features. Include:

- Which feature (coderunner)
- Version number
- Steps to reproduce
- Expected vs actual behavior

## 📄 License

By contributing, you agree that your contributions will be licensed under the MIT License.
