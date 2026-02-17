# clickthecity.com

https://www.clickthecity.com/tv/schedules/

### Download the guide

```sh
npm run grab --- --site=clickthecity.com
```

### Update channel list

```sh
npm run channels:parse --- --config=./sites/clickthecity.com/clickthecity.com.config.js --output=./sites/clickthecity.com/clickthecity.com.channels.xml
```

### Test

```sh
npm test --- clickthecity.com
```
