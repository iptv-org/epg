# epg.iptvx.one

https://epg.iptvx.one/

### Download the guide

Windows:

```sh
SET "NODE_OPTIONS=--max-old-space-size=5000" && npm run grab --- --site=epg.iptvx.one
```

Linux and macOS:

```sh
NODE_OPTIONS=--max-old-space-size=5000 npm run grab --- --site=epg.iptvx.one
```

### Update channel list

Windows:

```sh
SET "NODE_OPTIONS=--max-old-space-size=5000" && npm run channels:parse --- --config=./sites/epg.iptvx.one/epg.iptvx.one.config.js --output=./sites/epg.iptvx.one/epg.iptvx.one.channels.xml
```

Linux and macOS:

```sh
NODE_OPTIONS=--max-old-space-size=5000 npm run channels:parse --- --config=./sites/epg.iptvx.one/epg.iptvx.one.config.js --output=./sites/epg.iptvx.one/epg.iptvx.one.channels.xml
```

### Test

```sh
npm test --- epg.iptvx.one
```
