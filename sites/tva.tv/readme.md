# tva.tv

https://tva.tv/

### Download the guide

```sh
npm run grab --- --site=tva.tv
```

### Update channel list

```sh
npm run channels:parse --- --config=./sites/tva.tv/tva.tv.config.js --output=./sites/tva.tv/tva.tv.channels.xml
```

### Test

```sh
npm test --- tva.tv
```
