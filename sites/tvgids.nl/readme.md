# tvgids.nl

https://www.tvgids.nl/gids/

### Download the guide

```sh
npm run grab --- --site=tvgids.nl
```

### Update channel list

```sh
npm run channels:parse --- --config=./sites/tvgids.nl/tvgids.nl.config.js --output=./sites/tvgids.nl/tvgids.nl.channels.xml
```

### Test

```sh
npm run test:site tvgids.nl
```
