#!/bin/zsh
# double-click to start Sage
set -euo pipefail
cd "$(dirname "$0")"

# Finder doesn't load the shell profile, so node/npm may not be on PATH
export PATH="/opt/homebrew/bin:/usr/local/bin:/usr/bin:/bin:$PATH"

PORT=4400
URL="http://localhost:$PORT"

if ! command -v node >/dev/null 2>&1; then
  echo "Node.js was not found. Install it from https://nodejs.org or homebrew and try again."
  echo "Press any key to close."
  read -rk 1
  exit 1
fi

if ! command -v npm >/dev/null 2>&1; then
  echo "npm was not found. Ensure Node.js/npm is installed and on PATH."
  echo "Press any key to close."
  read -rk 1
  exit 1
fi

# already running? just open the browser
if lsof -i :"$PORT" >/dev/null 2>&1; then
  echo "Sage is already running at $URL"
  open "$URL"
  exit 0
fi

if [ ! -d node_modules ]; then
  echo "Installing dependencies (first run)..."
  if [ -f package-lock.json ]; then
    npm ci --silent
  else
    npm install --silent
  fi
fi

echo "Building the app..."
npm run build --silent

echo "Starting Sage at $URL"
echo "Keep this window open while studying. Press Ctrl+C to stop."
(sleep 1 && open "$URL") &
exec node server/index.js
