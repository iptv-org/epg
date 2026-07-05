#!/bin/bash
set -e
export CURR_DATE=$(date -d "yesterday" +%Y-%m-%dT00:00:00.000Z)

REGION="$1"
shift

DATA_DIR="${EPG_DATA_DIR:-/epg/data}"
LOCK_DIR="$DATA_DIR/locks"
mkdir -p "$LOCK_DIR"
LOCK_FILE="$LOCK_DIR/$REGION.lock"

exec 200>"$LOCK_FILE"
if ! flock -n 200; then
  echo "region '$REGION' is already locked by another grab, aborting" >&2
  exit 1
fi

npm run grab -- "$@" --days=6
