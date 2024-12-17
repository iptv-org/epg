# mysky.com.ph

https://www.mysky.com.ph/metromanila/tv-schedules

### Download the guide

```sh
npm run grab --- --site=mysky.com.ph
```

### Update channel list

```sh
npm run channels:parse --- --config=./sites/mysky.com.ph/mysky.com.ph.config.js --output=./sites/mysky.com.ph/mysky.com.ph.channels.xml
```

### Test

```sh
npm test --- mysky.com.ph
```
