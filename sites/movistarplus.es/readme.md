# movistarplus.es

https://www.movistarplus.es/programacion-tv

### Download the guide

```sh
npm run grab --- --site=movistarplus.es
```

### Update channel list

```sh
npm run channels:parse --- --config=./sites/movistarplus.es/movistarplus.es.config.js --output=./sites/movistarplus.es/movistarplus.es.channels.xml
```

### Test

```sh
npm test --- movistarplus.es
```
