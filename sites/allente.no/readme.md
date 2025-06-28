# allente.no

https://www.allente.no/tv-guide/

### Download the guide

```sh
npm run grab --- --site=allente.no
```

### Update channel list

```sh
npm run channels:parse --- --config=./sites/allente.no/allente.no.config.js --output=./sites/allente.no/allente.no.channels.xml
```

### Test

```sh
npm test --- allente.no
```
