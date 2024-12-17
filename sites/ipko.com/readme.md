# ipko.com

https://www.ipko.com/epg/

### Download the guide

```sh
npm run grab --- --site=ipko.com
```

### Update channel list

```sh
npm run channels:parse --- --config=./sites/ipko.com/ipko.com.config.js --output=./sites/ipko.com/ipko.com.channels.xml
```

### Test

```sh
npm test --- ipko.com
```
