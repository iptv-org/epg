# example.com

https://example.com

### Download the guide

```sh
npm run grab --- --site=example.com
```

### Update channel list

```sh
npm run channels:parse --- --config=./sites/example.com/example.com.config.js --output=./sites/example.com/example.com.channels.xml
```

### Test

```sh
npm test --- example.com
```
