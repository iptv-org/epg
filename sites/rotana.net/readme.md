# rotana.net

https://rotana.net/ar/streams (Arabic)

https://rotana.net/en/streams (English)

### Download the guide

Arabic:

```sh
npm run grab --- --site=rotana.net --lang=ar
```

English:

```sh
npm run grab --- --site=rotana.net --lang=en
```

### Update channel list

Arabic:

```sh
npm run channels:parse --- --config=./sites/rotana.net/rotana.net.config.js --output=./sites/rotana.net/rotana.net_ar.channels.xml --set=lang:ar
```

English:

```sh
npm run channels:parse --- --config=./sites/rotana.net/rotana.net.config.js --output=./sites/rotana.net/rotana.net_en.channels.xml --set=lang:en
```

### Test

```sh
npm test --- rotana.net
```
