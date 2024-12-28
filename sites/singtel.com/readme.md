# singtel.com

https://www.singtel.com/personal/products-services/tv/tv-programme-guide

### Download the guide

```sh
npm run grab --- --site=singtel.com
```

### Update channel list

```sh
npm run channels:parse --- --config=./sites/singtel.com/singtel.com.config.js --output=./sites/singtel.com/singtel.com.channels.xml
```

### Test

```sh
npm test --- singtel.com
```
