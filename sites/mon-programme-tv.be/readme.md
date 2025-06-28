# mon-programme-tv.be

https://www.mon-programme-tv.be/mon-programme-television.html

### Download the guide

```sh
npm run grab --- --site=mon-programme-tv.be
```

### Update channel list

```sh
npm run channels:parse --- --config=./sites/mon-programme-tv.be/mon-programme-tv.be.config.js --output=./sites/mon-programme-tv.be/mon-programme-tv.be.channels.xml
```

### Test

```sh
npm test --- mon-programme-tv.be
```
