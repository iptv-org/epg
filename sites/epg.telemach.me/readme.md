# epg.telemach.me

https://epg.telemach.me/

### Download the guide

```sh
npm run grab --- --site=epg.telemach.me
```

### Update channel list

```sh
npm run channels:parse --- --config=./sites/epg.telemach.me/epg.telemach.me.config.js --output=./sites/epg.telemach.me/epg.telemach.me.channels.xml
```

### Test

```sh
npm test --- epg.telemach.me
```
