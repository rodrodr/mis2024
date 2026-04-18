#!/usr/bin/env bash

set -euo pipefail

if ! git rev-parse --is-inside-work-tree >/dev/null 2>&1; then
  echo "Error: this folder is not a git repository."
  exit 1
fi

if [[ $# -eq 0 ]]; then
  echo "Usage: ./publish.sh \"commit message\""
  exit 1
fi

COMMIT_MESSAGE="$*"

echo "Building site into docs/..."
npm run build

echo "Staging publishable files..."
git add docs src public package.json package-lock.json vite.config.js index.html README.md .gitignore publish.sh

if git diff --cached --quiet; then
  echo "No changes to publish."
  exit 0
fi

echo "Creating commit..."
git commit -m "$COMMIT_MESSAGE"

echo "Pushing to origin/main..."
git push origin main

echo "Done. GitHub Pages should update from main/docs."
