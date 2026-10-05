# aljazeera.com

https://www.aljazeera.com/schedule

### Download the guide

```sh
npm run grab --- --sites=aljazeera.com
```

### Update channel list

```sh
npm run channels:parse --- --config=./sites/aljazeera.com/aljazeera.com.config.js --output=./sites/aljazeera.com/aljazeera.com.channels.xml
```

### Test

```sh
npm test --- aljazeera.com
```
