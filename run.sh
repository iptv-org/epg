#!/bin/bash 

npx epg-grabber --config=sites/programme-tv.net.config.js && \
npx epg-grabber --config=sites/tvguide.co.uk.config.js && \
npx epg-grabber --config=sites/ontvtonight.com.config.js && \
npx epg-grabber --config=sites/tv.yandex.ru.config.js