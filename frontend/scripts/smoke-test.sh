#!/usr/bin/env bash
set -euo pipefail

# Simple smoke-test for the backend using the env-provided base URL.
# Usage:
#   TOKEN=... bash scripts/smoke-test.sh
# or
#   bash scripts/smoke-test.sh https://ryanmart.store/backend

BASE_ARG=${1:-}
BASE=${BASE_ARG:-https://ryanmart.store/backend}

HEALTH_URL="$BASE/api/health"
ME_URL="$BASE/api/me"

echo "Running smoke tests against: $BASE"

# Health check (non-auth)
echo "Checking health endpoint: $HEALTH_URL"
HTTP=$(curl -s -o /dev/null -w "%{http_code}" "$HEALTH_URL" || true)
if [ "$HTTP" == "200" ]; then
  echo "Health: OK (200)"
else
  echo "Health: FAIL ($HTTP) - $HEALTH_URL"
  exit 2
fi

# Authenticated check if TOKEN provided
if [ -n "${TOKEN-}" ]; then
  echo "Checking authenticated endpoint: $ME_URL"
  HTTP=$(curl -s -o /dev/null -w "%{http_code}" -H "Authorization: Bearer $TOKEN" "$ME_URL" || true)
  if [ "$HTTP" == "200" ]; then
    echo "Auth check: OK (200)"
  else
    echo "Auth check: FAIL ($HTTP) - $ME_URL"
    exit 3
  fi
else
  echo "No TOKEN provided — skipping authenticated test."
fi

echo "All smoke tests passed against $BASE"
exit 0
