# virgintvgo.virginmedia.com

https://virgintvgo.virginmedia.com/en/epg/initial

### Download the guide

```sh
npm run grab --- --site=virgintvgo.virginmedia.com
```

### Update channel list

```sh
npm run channels:parse --- --config=./sites/virgintvgo.virginmedia.com/virgintvgo.virginmedia.com.config.js --output=./sites/virgintvgo.virginmedia.com/virgintvgo.virginmedia.com.channels.xml
```

### Test

```sh
npm test --- virgintvgo.virginmedia.com
```
