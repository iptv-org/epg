#!/bin/bash
export CURR_DATE=$(date -d "yesterday" +%Y-%m-%dT00:00:00.000Z)
npm run grab -- "$@" --days=6
