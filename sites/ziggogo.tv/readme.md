# ziggogo.tv

https://www.ziggogo.tv/nl/epg/initial

### Download the guide

```sh
npm run grab --- --site=ziggogo.tv
```

### Update channel list

```sh
npm run channels:parse --- --config=./sites/ziggogo.tv/ziggogo.tv.config.js --output=./sites/ziggogo.tv/ziggogo.tv.channels.xml
```

### Test

```sh
npm test --- ziggogo.tv
```
