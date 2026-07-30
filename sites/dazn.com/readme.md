# dazn.com

https://www.dazn.com/de-DE/epg-fixture/

### Download the guide

```sh
npm run grab --- --sites=dazn.com
```

### Update channel list

```sh
npm run channels:parse --- --config=./sites/dazn.com/dazn.com.config.js --output=./sites/dazn.com/dazn.com.channels.xml
```

### Test

```sh
npm test --- dazn.com
```
