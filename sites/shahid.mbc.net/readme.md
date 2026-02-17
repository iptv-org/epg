# shahid.mbc.net

https://shahid.mbc.net/ar/livestream (Arabic)

https://shahid.mbc.net/en/livestream (English)

https://shahid.mbc.net/fr/livestream (French)

### Download the guide

Arabic:

```sh
npm run grab --- --site=shahid.mbc.net --lang=ar
```

English:

```sh
npm run grab --- --site=shahid.mbc.net --lang=en
```

French:

```sh
npm run grab --- --site=shahid.mbc.net --lang=fr
```

### Update channel list

Arabic:

```sh
npm run channels:parse --- --config=./sites/shahid.mbc.net/shahid.mbc.net.config.js --output=./sites/shahid.mbc.net/shahid.mbc.net_ar.channels.xml --set=lang:ar
```

English:

```sh
npm run channels:parse --- --config=./sites/shahid.mbc.net/shahid.mbc.net.config.js --output=./sites/shahid.mbc.net/shahid.mbc.net_en.channels.xml --set=lang:en
```

French:

```sh
npm run channels:parse --- --config=./sites/shahid.mbc.net/shahid.mbc.net.config.js --output=./sites/shahid.mbc.net/shahid.mbc.net_fr.channels.xml --set=lang:fr
```

### Test

```sh
npm test --- shahid.mbc.net
```
