# zap.co.ao

https://zap.co.ao/tv/guia-tv

### Download the guide

```sh
npm run grab --- --site=zap.co.ao
```

### Update channel list

```sh
npm run channels:parse --- --config=./sites/zap.co.ao/zap.co.ao.config.js --output=./sites/zap.co.ao/zap.co.ao.channels.xml
```

### Test

```sh
npm test --- zap.co.ao
```
