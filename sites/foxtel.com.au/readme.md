# foxtel.com.au

https://www.foxtel.com.au/ _[Geo-blocked]_

### Download the guide

```sh
npm run grab --- --site=foxtel.com.au
```

### Update channel list

```sh
npm run channels:parse --- --config=./sites/foxtel.com.au/foxtel.com.au.config.js --output=./sites/foxtel.com.au/foxtel.com.au.channels.xml
```

### Test

```sh
npm test --- foxtel.com.au
```
