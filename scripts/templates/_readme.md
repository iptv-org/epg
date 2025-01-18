# <DOMAIN>

https://example.com

### Download the guide

```sh
npm run grab --- --site=<DOMAIN>
```

### Update channel list

```sh
npm run channels:parse --- --config=./sites/<DOMAIN>/<DOMAIN>.config.js --output=./sites/<DOMAIN>/<DOMAIN>.channels.xml
```

### Test

```sh
npm test --- <DOMAIN>
```
