#!/bin/sh

channels_changed="$(git diff --staged --name-only --diff-filter=ACMR -- 'sites/**/*.channels.xml' | sed 's| |\\ |g')"
        
if [ ! -z "$channels_changed" ]; then
    npm run channels:validate -- $channels_changed
fi