# vrt.be

https://www.vrt.be/vrtmax/tv-gids/

### Download the guide

```sh
npm run grab --- --site=vrt.be
```

### Update channel list

```sh
npm run channels:parse --- --config=./sites/vrt.be/vrt.be.config.js --output=./sites/vrt.be/vrt.be.channels.xml
```

### Test

```sh
npm test --- vrt.be
```
