# sky.com

https://www.sky.com/tv-guide

### Download the guide

```sh
npm run grab --- --site=sky.com
```

### Update channel list

```sh
npm run channels:parse --- --config=./sites/sky.com/sky.com.config.js --output=./sites/sky.com/sky.com.channels.xml
```

### Test

```sh
npm test --- sky.com
```
