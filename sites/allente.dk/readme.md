# allente.dk

https://www.allente.dk/tv-guide/

### Download the guide

```sh
npm run grab --- --site=allente.dk
```

### Update channel list

```sh
npm run channels:parse --- --config=./sites/allente.dk/allente.dk.config.js --output=./sites/allente.dk/allente.dk.channels.xml
```

### Test

```sh
npm test --- allente.dk
```
