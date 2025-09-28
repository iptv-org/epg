# bein.com

https://www.bein.com/ar/%D8%AC%D8%AF%D9%88%D9%84-%D8%A7%D9%84%D8%A8%D8%AB/ (Arabic)

https://www.bein.com/en/tv-guide/ (English)

### Download the guide

Arabic:

```sh
npm run grab --- --site=bein.com --lang=ar
```

English:

```sh
npm run grab --- --site=bein.com --lang=en
```

### Update channel list

Arabic:

```sh
npm run channels:parse --- --config=./sites/bein.com/bein.com.config.js --output=./sites/bein.com/bein.com_ar.channels.xml --set=lang:ar
```

English:

```sh
npm run channels:parse --- --config=./sites/bein.com/bein.com.config.js --output=./sites/bein.com/bein.com_en.channels.xml --set=lang:en
```

### Test

```sh
npm test --- bein.com
```
