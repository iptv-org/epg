# yes.co.il

https://www.yes.co.il/content/tv/broadcast

### Download the guide

```sh
npm run grab --- --site=yes.co.il
```

### Update channel list

```sh
npm run channels:parse --- --config=./sites/yes.co.il/yes.co.il.config.js --output=./sites/yes.co.il/yes.co.il.channels.xml
```

### Test

```sh
npm test --- yes.co.il
```
