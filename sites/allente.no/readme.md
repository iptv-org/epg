# allente.no

https://www.allente.no/tv-guide/

### Download the guide

```sh
npm run grab --- --sites=allente.no
```

### Update channel list

```sh
npm run channels:parse --- --config=./sites/allente.no/allente.no.config.js --output=./sites/allente.no/allente.no_no.channels.xml
```

### Test

```sh
npm test --- allente.no
```
