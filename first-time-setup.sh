#!/usr/bin/env bash

set -euo pipefail

BASE_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
CORE_DIR="$BASE_DIR/Bizpark.Core"
ENV_FILE="$CORE_DIR/.env"

if [[ ! -d "$CORE_DIR" ]]; then
  echo "Missing Bizpark.Core directory: $CORE_DIR"
  exit 1
fi

if [[ ! -f "$ENV_FILE" ]]; then
  echo "Missing env file: $ENV_FILE"
  echo "Create it first (copy from Bizpark.Core/.env.example)."
  exit 1
fi

if ! grep -Eq '^[[:space:]]*DATABASE_URL=' "$ENV_FILE"; then
  echo "DATABASE_URL is missing in $ENV_FILE"
  exit 1
fi

echo "Bootstrapping database schema..."
(
  set -a
  source "$ENV_FILE"
  set +a
  cd "$CORE_DIR"
  npm run db:bootstrap
)

echo "First-time DB setup completed."
