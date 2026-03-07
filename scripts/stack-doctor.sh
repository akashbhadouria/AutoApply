#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT_DIR"

BACKEND_URL="${BACKEND_URL:-http://localhost:4000}"
FRONTEND_URL="${FRONTEND_URL:-http://localhost:3000}"

check_json() {
  local label="$1"
  local url="$2"

  echo "== $label =="
  if ! response="$(curl -sS "$url")"; then
    echo "FAIL: request failed for $url"
    echo
    return 1
  fi

  echo "$response" | head -c 600
  echo
  echo
}

check_status() {
  local label="$1"
  local url="$2"
  local code

  code="$(curl -sS -o /tmp/autoapply-doctor.out -w "%{http_code}" "$url" || true)"
  echo "$label: $code $url"
}

echo "AutoApply stack doctor"
echo

check_json "Backend health" "$BACKEND_URL/health"
check_json "Dashboard summary" "$BACKEND_URL/api/dashboard/summary"

echo "Frontend route status"
for route in \
  / \
  /jobs \
  /applications \
  /automation \
  /profile \
  /referrals \
  /settings \
  /fresh-jobs \
  /job-watchers \
  /outreach-inbox
do
  check_status "route" "$FRONTEND_URL$route"
done

echo
echo "Frontend proxy status"
for route in \
  /api/jobs \
  /api/applications \
  /api/referrals \
  /api/me \
  /api/me/preferences \
  /api/me/job-watchers \
  /api/automation/queues
do
  check_status "proxy" "$FRONTEND_URL$route"
done

echo
echo "Frontend asset smoke test"
for route in \
  /_next/static/chunks/app/layout.js \
  /_next/static/chunks/main-app.js \
  /_next/static/css/app/layout.css
do
  check_status "asset" "$FRONTEND_URL$route"
done
