# teliatv.ee

https://www.teliatv.ee/kava/ (Estonian)

https://www.teliatv.ee/en/kava/ (English)

https://www.teliatv.ee/ru/kava/ (Russian)

### Download the guide

Estonian:

```sh
npm run grab --- --channels=sites/teliatv.ee/teliatv.ee_et.channels.xml
```

English:

```sh
npm run grab --- --channels=sites/teliatv.ee/teliatv.ee_en.channels.xml
```

Russian:

```sh
npm run grab --- --channels=sites/teliatv.ee/teliatv.ee_ru.channels.xml
```

### Update channel list

Estonian:

```sh
npm run channels:parse --- --config=./sites/teliatv.ee/teliatv.ee.config.js --output=./sites/teliatv.ee/teliatv.ee_et.channels.xml --set=lang:et
```

English:

```sh
npm run channels:parse --- --config=./sites/teliatv.ee/teliatv.ee.config.js --output=./sites/teliatv.ee/teliatv.ee_en.channels.xml --set=lang:en
```

Russian:

```sh
npm run channels:parse --- --config=./sites/teliatv.ee/teliatv.ee.config.js --output=./sites/teliatv.ee/teliatv.ee_ru.channels.xml --set=lang:ru
```

### Test

```sh
npm test --- teliatv.ee
```
