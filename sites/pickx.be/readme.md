# pickx.be

https://www.pickx.be/fr/television/programme-tv

### Download the guide

```sh
npm run grab --- --site=pickx.be
```

### Update channel list

```sh
npm run channels:parse --- --config=./sites/pickx.be/pickx.be.config.js --output=./sites/pickx.be/pickx.be.channels.xml
```

### Test

```sh
npm test --- pickx.be
```
