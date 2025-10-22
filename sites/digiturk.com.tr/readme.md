# digiturk.com.tr

https://www.digiturk.com.tr/yayin-akisi (only accessible with a Turkish IP address)

### Download the guide

```sh
npm run grab --- --site=digiturk.com.tr
```

### Update channel list

```sh
npm run channels:parse --- --config=./sites/digiturk.com.tr/digiturk.com.tr.config.js --output=./sites/digiturk.com.tr/digiturk.com.tr.channels.xml
```

### Test

```sh
npm test --- digiturk.com.tr
```
