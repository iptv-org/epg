# tv.movistar.co

https://tv.movistar.co/tv-guide/epg [Geo-blocked]

### Download the guide

```sh
npm run grab --- --site=tv.movistar.co
```

### Update channel list

```sh
npm run channels:parse --- --config=./sites/tv.movistar.co/tv.movistar.co.config.js --output=./sites/tv.movistar.co/tv.movistar.co.channels.xml
```

### Test

```sh
npm test --- tv.movistar.co
```
