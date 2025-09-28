# orangetv.es

https://orangetv.orange.es/epg

### Download the guide

```sh
npm run grab --- --site=orangetv.orange.es
```

### Update channel list

```sh
npm run channels:parse --- --config=./sites/orangetv.orange.es/orangetv.orange.es.config.js --output=./sites/orangetv.orange.es/orangetv.orange.es.channels.xml
```

### Test

```sh
npm test --- orangetv.orange.es
```

### Todo

Some channels of this provider are not added to the channel database :

- Gametoon.es (not sure whether this is the same channel as Gametoon.com)
