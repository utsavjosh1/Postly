#!/bin/bash
set -e

echo "🔍 Running pre-push validation checks..."

# 1. Format check
echo ""
echo "📝 Checking code formatting..."
npm run format

# 2. Lint check
echo ""
echo "🔎 Running linters..."
npm run lint

# 3. Build check
echo ""
echo "🏗️  Building all workspaces..."
npm run build

echo ""
echo "✅ All pre-push checks passed!"
