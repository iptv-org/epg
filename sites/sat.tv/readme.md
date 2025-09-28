# sat.tv

https://sat.tv/tv-channels

### Download the guide

Arabic:

```sh
npm run grab --- --site=sat.tv --lang=ar
```

English:

```sh
npm run grab --- --site=sat.tv --lang=en
```

### Update channel list

Arabic:

```sh
npm run channels:parse --- --config=./sites/sat.tv/sat.tv.config.js --output=./sites/sat.tv/sat.tv_ar.channels.xml --set=lang:ar
```

English:

```sh
npm run channels:parse --- --config=./sites/sat.tv/sat.tv.config.js --output=./sites/sat.tv/sat.tv_en.channels.xml --set=lang:en
```

### Test

```sh
npm test --- sat.tv
```
