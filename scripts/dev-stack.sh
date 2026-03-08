#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT_DIR"

COMPOSE_FILE="docker-compose.dev.yml"
POSTGRES_URL="postgresql://postgres:postgres@localhost:55432/job_hunter"
REDIS_URL="redis://localhost:56379"
FRONTEND_URL="http://localhost:3000"
BACKEND_URL="http://localhost:4000"

require_command() {
  if ! command -v "$1" >/dev/null 2>&1; then
    echo "Missing required command: $1" >&2
    exit 1
  fi
}

require_command docker
require_command npm
require_command bash

mkdir -p .logs

copy_env_if_missing() {
  local source_file="$1"
  local target_file="$2"
  if [[ ! -f "$target_file" ]]; then
    cp "$source_file" "$target_file"
  fi
}

copy_env_if_missing backend/.env.example backend/.env
copy_env_if_missing frontend/.env.example frontend/.env.local
copy_env_if_missing workers/.env.example workers/.env

ensure_port_free() {
  local port="$1"
  if ss -ltn "( sport = :$port )" | tail -n +2 | grep -q .; then
    echo "Port $port is already in use. Stop the existing process before running scripts/dev-stack.sh." >&2
    exit 1
  fi
}

ensure_port_free 3000
ensure_port_free 4000

echo "Starting Docker dependencies..."
docker compose -f "$COMPOSE_FILE" up -d postgres redis >/dev/null

echo "Waiting for PostgreSQL..."
until docker compose -f "$COMPOSE_FILE" exec -T postgres pg_isready -U postgres -d job_hunter >/dev/null 2>&1; do
  sleep 1
done

echo "Applying schema..."
docker compose -f "$COMPOSE_FILE" exec -T postgres psql -U postgres -d job_hunter < database/schema.sql >/dev/null

start_process() {
  local name="$1"
  shift

  (
    export DATABASE_URL="$POSTGRES_URL"
    export REDIS_URL="$REDIS_URL"
    export BACKEND_URL="$BACKEND_URL"
    export FRONTEND_ORIGIN="$FRONTEND_URL"
    "$@" 2>&1 | while IFS= read -r line; do
      printf '[%s] %s\n' "$name" "$line"
    done
  ) &
  PIDS+=("$!")
}

declare -a PIDS=()

cleanup() {
  if [[ ${#PIDS[@]} -gt 0 ]]; then
    kill "${PIDS[@]}" >/dev/null 2>&1 || true
  fi
}

trap cleanup EXIT INT TERM

echo "Starting backend, frontend, and workers..."
start_process backend npm run dev:backend
start_process frontend npm run dev:frontend
start_process workers npm run dev:workers

echo
echo "AutoApply dev stack is starting."
echo "Frontend:  $FRONTEND_URL"
echo "Backend:   $BACKEND_URL"
echo "Postgres:  $POSTGRES_URL"
echo "Redis:     $REDIS_URL"
echo
echo "Press Ctrl+C to stop the app processes. Docker services will remain running."

wait
