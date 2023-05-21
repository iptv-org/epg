#!/bin/bash

mkdir -p scripts/tmp/data
curl -L -o scripts/tmp/data/channels.json https://iptv-org.github.io/api/channels.json
curl -L -o scripts/tmp/data/countries.json https://iptv-org.github.io/api/countries.json
curl -L -o scripts/tmp/data/regions.json https://iptv-org.github.io/api/regions.json
curl -L -o scripts/tmp/data/subdivisions.json https://iptv-org.github.io/api/subdivisions.json