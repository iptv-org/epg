# firstmedia.com

https://www.firstmedia.com/product/tv-guide

### Download the guide

```sh
npm run grab --- --site=firstmedia.com
```

### Update channel list

```sh
npm run channels:parse --- --config=./sites/firstmedia.com/firstmedia.com.config.js --output=./sites/firstmedia.com/firstmedia.com.channels.xml
```

### Test

```sh
npm test --- firstmedia.com
```
