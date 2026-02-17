# tvim.tv

https://www.tvim.tv/tv-guide/on-tvim

### Download the guide

```sh
npm run grab --- --site=tvim.tv
```

### Update channel list

```sh
npm run channels:parse --- --config=./sites/tvim.tv/tvim.tv.config.js --output=./sites/tvim.tv/tvim.tv.channels.xml
```

### Test

```sh
npm test --- tvim.tv
```
