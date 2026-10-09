# play.tv

https://www.play.tv

### Download the guide

```sh
npm run grab --- --site=play.tv
```

### Update channel list

```sh
npm run channels:parse --- --config=./sites/play.tv/play.tv.config.js --output=./sites/play.tv/play.tv.channels.xml
```

### Test

```sh
npm test --- play.tv
```