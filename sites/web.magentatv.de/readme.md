# web.magentatv.de

https://web.magentatv.de/tv-guide

### Download the guide

```sh
npm run grab --- --site=web.magentatv.de
```

### Update channel list

```sh
npm run channels:parse --- --config=./sites/web.magentatv.de/web.magentatv.de.config.js --output=./sites/web.magentatv.de/web.magentatv.de.channels.xml
```

### Test

```sh
npm test --- web.magentatv.de
```
