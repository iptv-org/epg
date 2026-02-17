# digea.gr

https://www.digea.gr/el/tileoptikoi-stathmoi/ilektronikos-odigos-programmatos

### Download the guide

```sh
npm run grab --- --site=digea.gr
```

### Update channel list

```sh
npm run channels:parse --- --config=./sites/digea.gr/digea.gr.config.js --output=./sites/digea.gr/digea.gr.channels.xml
```

### Test

```sh
npm test --- digea.gr
```
