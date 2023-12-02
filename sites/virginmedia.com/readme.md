# virginmedia.com

https://virgintvgo.virginmedia.com/en/epg/initial

### Download the guide

```sh
npm run grab -- --site=virginmedia.com
```

### Update channel list

```sh
npm run channels:parse -- --config=./sites/virginmedia.com/virginmedia.com.config.js --output=./sites/virginmedia.com/virginmedia.com.channels.xml
```

### Test

```sh
npm test -- virginmedia.com
```
