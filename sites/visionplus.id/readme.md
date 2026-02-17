# visionplus.id

https://www.visionplus.id/channel

### Download the guide

Indonesian:

```sh
npm run grab --- --site=visionplus.id --lang=id
```

English:

```sh
npm run grab --- --site=visionplus.id --lang=en
```

### Update channel list

Indonesian:

```sh
npm run channels:parse --- --config=./sites/visionplus.id/visionplus.id.config.js --output=./sites/visionplus.id/visionplus.id_id.channels.xml --set=lang:id
```

English:

```sh
npm run channels:parse --- --config=./sites/visionplus.id/visionplus.id.config.js --output=./sites/visionplus.id/visionplus.id_en.channels.xml --set=lang:en
```

### Test

```sh
npm test --- visionplus.id
```
