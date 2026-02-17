# telenet.tv

https://www.telenet.tv/nl/epg/initial

### Download the guide

```sh
npm run grab --- --site=telenet.tv
```

### Update channel list

```sh
npm run channels:parse --- --config=./sites/telenet.tv/telenet.tv.config.js --output=./sites/telenet.tv/telenet.tv.channels.xml
```

### Test

```sh
npm test --- telenet.tv
```
