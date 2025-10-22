# cubmu.com

https://cubmu.com/live-tv _[Geo-restricted]_

### Download the guide

Indonesian:

```sh
npm run grab --- --site=cubmu.com --lang=id
```

English:

```sh
npm run grab --- --site=cubmu.com --lang=en
```

### Update channel list

Indonesian:

```sh
npm run channels:parse --- --config=sites/cubmu.com/cubmu.com.config.js --output=sites/cubmu.com/cubmu.com_id.channels.xml --set=lang:id
```

English:

```sh
npm run channels:parse --- --config=sites/cubmu.com/cubmu.com.config.js --output=sites/cubmu.com/cubmu.com_en.channels.xml --set=lang:en
```

### Test

```sh
npm test --- cubmu.com
```
