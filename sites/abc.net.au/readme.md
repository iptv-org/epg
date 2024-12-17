# abc.net.au

https://www.abc.net.au/tv/epg/

### Download the guide

```sh
npm run grab --- --site=abc.net.au
```

### Update channel list

```sh
npm run channels:parse --- --config=./sites/abc.net.au/abc.net.au.config.js --output=./sites/abc.net.au/abc.net.au.channels.xml
```

### Test

```sh
npm test --- abc.net.au
```
