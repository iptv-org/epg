# programme-tv.net

https://www.programme-tv.net/

### Download the guide

```sh
npm run grab --- --site=programme-tv.net
```

### Update channel list

```sh
npm run channels:parse --- --config=./sites/programme-tv.net/programme-tv.net.config.js --output=./sites/programme-tv.net/programme-tv.net.channels.xml
```

### Test

```sh
npm test --- programme-tv.net
```
