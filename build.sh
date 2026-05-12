#!/bin/bash
set -e

echo "Building BetterDraw..."
npm run tauri build 2>&1 | grep -v "warning:" || true

APP_PATH="src-tauri/target/release/bundle/macos/BetterDraw.app"

if [ ! -d "$APP_PATH" ]; then
  echo "Error: Build failed — .app not found at $APP_PATH"
  exit 1
fi

echo "Copying to /Applications..."
rm -rf "/Applications/BetterDraw.app"
cp -R "$APP_PATH" "/Applications/BetterDraw.app"

echo "Done! BetterDraw.app installed to /Applications"
