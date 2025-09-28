# tv2go.t-2.net

https://tv2go.t-2.net/tv/epg/

### Download the guide

```sh
npm run grab --- --site=tv2go.t-2.net
```

### Update channel list

```sh
npm run channels:parse --- --config=./sites/tv2go.t-2.net/tv2go.t-2.net.config.js --output=./sites/tv2go.t-2.net/tv2go.t-2.net.channels.xml
```

### Test

```sh
npm test --- tv2go.t-2.net
```
