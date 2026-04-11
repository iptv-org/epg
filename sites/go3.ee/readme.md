# go3.ee

https://go3.ee/live_tv

### Download the guide

```sh
npm run grab --- --site=go3.ee
```

### Update channel list

```sh
npm run channels:parse --- --config=./sites/go3.ee/go3.ee.config.js --output=./sites/go3.ee/go3.ee.channels.xml
```

### Test

```sh
npm test --- go3.ee
```
