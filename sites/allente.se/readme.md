# allente.se

https://www.allente.se/tv-guide/

### Download the guide

```sh
npm run grab --- --sites=allente.se
```

### Update channel list

```sh
npm run channels:parse --- --config=./sites/allente.se/allente.se.config.js --output=./sites/allente.se/allente.se_se.channels.xml
```

### Test

```sh
npm test --- allente.se
```
