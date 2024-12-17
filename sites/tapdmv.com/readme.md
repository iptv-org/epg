# tapdmv.com

https://tapdmv.com/Schedule/index.html

### Download the guide

```sh
npm run grab --- --site=tapdmv.com
```

### Update channel list

```sh
npm run channels:parse --- --config=./sites/tapdmv.com/tapdmv.com.config.js --output=./sites/tapdmv.com/tapdmv.com.channels.xml
```

### Test

```sh
npm test --- tapdmv.com
```
