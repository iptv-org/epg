# dazn.de

https://www.dazn.com/de-DE/epg-fixture/

### Download the guide

```sh
npm run grab --- --sites=dazn.de
```

### Update channel list

```sh
npm run channels:parse --- --config=./sites/dazn.de/dazn.de.config.js --output=./sites/dazn.de/dazn.de.channels.xml
```

### Test

```sh
npm test --- dazn.de
```
