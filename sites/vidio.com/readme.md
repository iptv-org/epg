# vidio.com

https://www.vidio.com/schedule/tv

### Download the guide

```sh
npm run grab --- --site=vidio.com
```

### Update channel list

```sh
npm run channels:parse --- --config=./sites/vidio.com/vidio.com.config.js --output=./sites/vidio.com/vidio.com.channels.xml
```

### Test

```sh
npm test --- vidio.com
```
