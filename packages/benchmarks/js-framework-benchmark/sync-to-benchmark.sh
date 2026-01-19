#!/bin/bash
# Sync fun-web benchmark to js-framework-benchmark repo

BENCHMARK_REPO="${1:-$HOME/develop/js-framework-benchmark}"
BUILD_MODE="${2:-prod}"
TARGET="$BENCHMARK_REPO/frameworks/keyed/fun-web"

if [ ! -d "$BENCHMARK_REPO" ]; then
  echo "Error: js-framework-benchmark repo not found at $BENCHMARK_REPO"
  echo "Usage: $0 [path-to-js-framework-benchmark]"
  exit 1
fi

echo "Building ($BUILD_MODE)..."
if [ "$BUILD_MODE" = "dev" ]; then
  pnpm run build-dev || exit 1
else
  pnpm run build-prod || exit 1
fi

echo "Copying files to $TARGET..."
mkdir -p "$TARGET/src" "$TARGET/dist"

cp src/index.ts "$TARGET/src/"
cp dist/main.js "$TARGET/dist/"
if [ -f dist/main.js.map ]; then
  cp dist/main.js.map "$TARGET/dist/"
fi
cp index.html "$TARGET/"
cp package.json.standalone "$TARGET/package.json"
cp .gitignore "$TARGET/" 2>/dev/null || true

echo "✓ Synced to $TARGET"
if [ "$BUILD_MODE" = "dev" ]; then
  echo "Now run: cd $TARGET && npm install"
  echo "Open http://localhost:8080/frameworks/keyed/fun-web/ for debugging"
else
  echo "Now run: cd $TARGET && npm install && npm run build-prod"
fi
