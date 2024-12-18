# chaines-tv.orange.fr

https://chaines-tv.orange.fr/programme-tv

### Download the guide

```sh
npm run grab --- --site=chaines-tv.orange.fr
```

### Update channel list

```sh
npm run channels:parse --- --config=./sites/chaines-tv.orange.fr/chaines-tv.orange.fr.config.js --output=./sites/chaines-tv.orange.fr/chaines-tv.orange.fr.channels.xml
```

### Test

```sh
npm test --- chaines-tv.orange.fr
```
