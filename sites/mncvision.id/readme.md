# mncvision.id

https://www.mncvision.id/schedule/table

### Download the guide

Indonesian:

```sh
npm run grab --- --site=mncvision.id --lang=id
```

English:

```sh
npm run grab --- --site=mncvision.id --lang=en
```

### Update channel list

Indonesian:

```sh
npm run channels:parse --- --config=./sites/mncvision.id/mncvision.id.config.js --output=./sites/mncvision.id/mncvision.id_id.channels.xml --set=lang:id
```

English:

```sh
npm run channels:parse --- --config=./sites/mncvision.id/mncvision.id.config.js --output=./sites/mncvision.id/mncvision.id_en.channels.xml --set=lang:en
```

### Test

```sh
npm test --- mncvision.id
```
