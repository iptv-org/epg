# <DOMAIN>

https://<DOMAIN>

### Download the guide

```sh
npm run grab --- --sites=<DOMAIN>
```

### Update channel list

```sh
npm run channels:parse --- --config=./sites/<DOMAIN>/<DOMAIN>.config.js --output=./sites/<DOMAIN>/<DOMAIN>.channels.xml
```

### Test

```sh
npm test --- <DOMAIN>
```
