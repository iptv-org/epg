# rikstv.no

https://play.rikstv.no/tv-guide

### Download the guide

```sh
npm run grab --- --site=rikstv.no
```

### Update channel list

```sh
npm run channels:parse --- --config=./sites/rikstv.no/rikstv.no.config.js --output=./sites/rikstv.no/rikstv.no.channels.xml
```

### Test

```sh
npm test --- rikstv.no
```
