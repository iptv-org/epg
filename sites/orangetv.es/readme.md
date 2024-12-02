# orangetv.es

https://orangetv.orange.es/epg

### Download the guide

```sh
npm run grab -- --site=orangetv.es
```

### Update channel list

```sh
npm run channels:parse -- --config=./sites/orangetv.es/orangetv.es.config.js --output=./sites/orangetv.es/orangetv.es.channels.xml
```

### Test

npm test -- orangetv.es

### Todo

Some channels of this provider are not added to the channel database :

- RuntimeSeries.es
- RuntimeCineSeries.es
- RuntimeCineTerror.es
- RuntimeAccion.es
- RuntimeComedia.es
- RuntimeCrimen.es
- RuntimeRomance.es
- RunTimeClasico.es
- CinesVerdiTV.es
- CineFeelGood.es
- Gametoon.es
