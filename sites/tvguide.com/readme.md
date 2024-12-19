# tvguide.com

https://www.tvguide.com/listings/

### Download the guide

```sh
npm run grab --- --site=tvguide.com
```

### Update channel list

```sh
npm run channels:parse --- --config=./sites/tvguide.com/tvguide.com.config.js --output=./sites/tvguide.com/tvguide.com.channels.xml
```

### Test

```sh
npm test --- tvguide.com
```
