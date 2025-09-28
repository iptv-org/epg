# snrt.ma

https://www.snrt.ma/ar/node/1208

### Download the guide

```sh
npm run grab --- --site=snrt.ma
```

### Update channel list

```sh
npm run channels:parse --- --config=./sites/snrt.ma/snrt.ma.config.js --output=./sites/snrt.ma/snrt.ma.channels.xml
```

### Test

```sh
npm test --- snrt.ma
```