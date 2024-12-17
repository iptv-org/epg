# allente.se

https://www.allente.se/tv-guide/

### Download the guide

```sh
npm run grab --- --site=allente.se
```

### Update channel list

```sh
npm run channels:parse --- --config=./sites/allente.se/allente.se.config.js --output=./sites/allente.se/allente.se.channels.xml
```

### Test

```sh
npm test --- allente.se
```
