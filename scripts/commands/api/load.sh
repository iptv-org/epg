#!/bin/bash

mkdir -p scripts/data
curl -L -o scripts/data/channels.json https://iptv-org.github.io/api/channels.json
curl -L -o scripts/data/countries.json https://iptv-org.github.io/api/countries.json
curl -L -o scripts/data/regions.json https://iptv-org.github.io/api/regions.json
curl -L -o scripts/data/subdivisions.json https://iptv-org.github.io/api/subdivisions.json