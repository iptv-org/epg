# epg.telemach.ba

https://epg.telemach.ba/

### Download the guide

```sh
npm run grab --- --site=epg.telemach.ba
```

### Update channel list

```sh
npm run channels:parse --- --config=./sites/epg.telemach.ba/epg.telemach.ba.config.js --output=./sites/epg.telemach.ba/epg.telemach.ba.channels.xml
```

### Test

```sh
npm test --- epg.telemach.ba
```
