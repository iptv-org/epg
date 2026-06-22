# iskon.hr

https://iskon.hr/televizija/tv-vodic

Iskon TV (Hrvatski Telekom). Public EPG, no auth. One JSON file per day holds EVERY channel's
programmes (`/api/epg/programs_YYYY_MM_DD.json`), fetched once and shared across channels; the
parser filters that day by `channelUuid`.

### Download the guide

```sh
npm run grab --- --sites=iskon.hr
```

### Update channel list

```sh
npm run channels:parse --- --config=./sites/iskon.hr/iskon.hr.config.js --output=./sites/iskon.hr/iskon.hr.channels.xml
```

### Test

```sh
npm test --- iskon.hr
```
