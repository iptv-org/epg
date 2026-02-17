# directv.com

https://www.directv.com/ _[Geo-blocked]_

### Download the guide

```sh
npm run grab --- --site=directv.com
```

### Update channel list

```sh
npm run channels:parse --- --config=./sites/directv.com/directv.com.config.js --output=./sites/directv.com/directv.com.channels.xml
```

### Test

```sh
npm test --- directv.com
```
