#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT_DIR/frontend"

if ss -ltn "( sport = :3000 )" | tail -n +2 | grep -q .; then
  echo "Port 3000 is already in use. Stop the existing frontend process first." >&2
  exit 1
fi

if [[ -d .next ]]; then
  find .next -mindepth 1 -maxdepth 1 -exec rm -rf {} +
fi

exec npm run dev
