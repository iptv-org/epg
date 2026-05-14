# www.magenta.tv

https://www.magenta.tv/tv-guide

### Download the guide

```sh
npm run grab --- --sites=www.magenta.tv
```

### Update channel list

```sh
npm run channels:parse --- --config=./sites/www.magenta.tv/www.magenta.tv.config.js --output=./sites/www.magenta.tv/www.magenta.tv.channels.xml
```

### Test

```sh
npm test --- www.magenta.tv
```
