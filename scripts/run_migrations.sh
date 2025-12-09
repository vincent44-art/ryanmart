#!/usr/bin/env bash
set -euo pipefail

# Run database migrations using Flask-Migrate (Flask CLI must be available in venv)
# Usage: ./scripts/run_migrations.sh

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
VEV="$ROOT_DIR/venv/bin"

if [ ! -x "$VEV/flask" ]; then
  echo "Flask CLI not found in venv. Make sure virtualenv is created and activated or venv exists at $ROOT_DIR/venv" >&2
  exit 1
fi

export FLASK_APP=backend.app
export FLASK_ENV=production

echo "Running database migrations (upgrade head)..."
"$VEV/flask" db upgrade
echo "Migrations complete."
