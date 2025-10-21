# jiotv.com

https://www.jiotv.com/tv-guide

### Download the guide

```sh
npm run grab --- --site=jiotv.com
```

### Update channel list

```sh
npm run channels:parse --- --config=./sites/jiotv.com/jiotv.com.config.js --output=./sites/jiotv.com/jiotv.com.channels.xml
```

### Test

```sh
npm test --- jiotv.com
```
