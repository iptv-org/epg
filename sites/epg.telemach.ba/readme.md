# epg.telemach.ba

https://epg.telemach.ba/

### Download the guide

```sh
npm run grab --- --site=epg.telemach.ba
```

### Update channel list

Available countries : ba/me

```sh
npm run channels:parse --- --config=./sites/epg.telemach.ba/epg.telemach.ba.config.js --output=./sites/epg.telemach.ba/epg.telemach.ba_<COUNTRY>.channels.xml --set=country:<COUNTRY>
```

### Test

```sh
npm test --- epg.telemach.ba
```
