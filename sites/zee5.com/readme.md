# zee5.com

https://zee5.com/tvguide

### Download the guide

```sh
npm run grab --- --site=zee5.com
```

### Update channel list

```sh
npm run channels:parse --- --config=./sites/zee5.com/zee5.com.config.js --output=./sites/zee5.com/zee5.com.channels.xml
```

### Test

```sh
npm test --- zee5.com
```
