---
description: Release blocknote-layout package to npm
---

# Release Workflow for BlockNote Layout

This workflow releases the `blocknote-layout` package to npm.

## Prerequisites

1. Ensure you have npm credentials configured
2. Ensure `NPM_TOKEN` secret is set in GitHub repository settings

## Release Steps

1. Update the version in `package.json`:
   ```bash
   npm version patch  # or minor, major
   ```

2. Commit the version change:
   ```bash
   git add package.json package-lock.json
   git commit -m "chore: bump version to X.Y.Z"
   ```

// turbo
3. Create a git tag following the `v<version>` pattern:
   ```bash
   git tag v<version>
   # Example: git tag v1.0.1
   ```

// turbo
4. Push the commit and tag to GitHub:
   ```bash
   git push origin main --tags
   ```

5. Monitor the GitHub Actions workflow:
   - Go to: https://github.com/gyash1512/blocknote-layout/actions
   - The "Release" workflow should trigger automatically
   - Verify the package is published to npm

## Manual npm Publish (Alternative)

If you need to publish manually without GitHub Actions:

// turbo
1. Build the package:
   ```bash
   npm run build
   ```

// turbo
2. Publish to npm:
   ```bash
   npm publish --access public
   ```

## Troubleshooting

- **Version mismatch error**: Ensure `package.json` version matches the git tag version (without the `v` prefix)
- **Auth error**: Verify `NPM_TOKEN` secret is correctly set in GitHub
