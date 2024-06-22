# disneystar.com

https://www.disneystar.com/tv-guide/

### Download the guide

```sh
npm run grab -- --site=disneystar.com
```

### Update channel list

```sh
npm run channels:parse -- --config=sites/disneystar.com/disneystar.com.config.js --output=sites/disneystar.com/disneystar.com.channels.xml
```

### Test

```sh
npm test -- disneystar.com
```
