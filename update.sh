#!/bin/bash 

./bin/epg-grabber/index.js --config=sites/tv.yandex.ru.config.js && \
./bin/epg-grabber/index.js --config=sites/tvguide.co.uk.config.js
# ./bin/epg-grabber/index.js --config=sites/programme-tv.net.config.js