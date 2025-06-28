# elcinema.com

https://elcinema.com/tvguide/ (Arabic)

https://elcinema.com/en/tvguide/ (English)

### Download the guide

Arabic:

```sh
npm run grab --- --site=elcinema.com --lang=ar
```

English:

```sh
npm run grab --- --site=elcinema.com --lang=en
```

### Update channel list

Arabic:

```sh
npm run channels:parse --- --config=./sites/elcinema.com/elcinema.com.config.js --output=./sites/elcinema.com/elcinema.com_ar.channels.xml --set=lang:ar
```

English:

```sh
npm run channels:parse --- --config=./sites/elcinema.com/elcinema.com.config.js --output=./sites/elcinema.com/elcinema.com_en.channels.xml --set=lang:en
```

### Test

```sh
npm test --- elcinema.com
```
