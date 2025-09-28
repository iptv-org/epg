# guida.tv

https://www.guida.tv/programmi-tv/

### Download the guide

```sh
npm run grab --- --site=guida.tv
```

### Update channel list

```sh
npm run channels:parse --- --config=./sites/guida.tv/guida.tv.config.js --output=./sites/guida.tv/guida.tv.channels.xml
```

### Test

```sh
npm test --- guida.tv
```
