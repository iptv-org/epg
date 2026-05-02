# maxstream.tv

https://maxstream.tv/home

### Download the guide

```sh
npm run grab --- --channels=sites/maxstream.tv/maxstream.tv.channels.xml
```

### Update channel list

```sh
npm run channels:parse --- --config=./sites/maxstream.tv/maxstream.tv.config.js --output=./sites/maxstream.tv/maxstream.tv.channels.xml
```

### Test

```sh
npm test --- maxstream.tv
```
