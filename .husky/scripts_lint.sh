#!/bin/sh

scripts_changed="$(git diff --staged --name-only --diff-filter=ACMR -- 'tests/**/*.ts' 'tests/**/*.js' 'scripts/**/*.ts' 'scripts/**/*.mts' 'scripts/**/*.js' 'sites/**/*.js' 'sites/**/*.ts' | sed 's| |\\ |g')"
        
if [ ! -z "$scripts_changed" ]; then
    npx eslint $scripts_changed
fi