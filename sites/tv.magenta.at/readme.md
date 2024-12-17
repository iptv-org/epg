# tv.magenta.at

https://tv.magenta.at/epg

### Download the guide

```sh
npm run grab --- --site=tv.magenta.at
```

### Update channel list

```sh
npm run channels:parse --- --config=./sites/tv.magenta.at/tv.magenta.at.config.js --output=./sites/tv.magenta.at/tv.magenta.at.channels.xml
```

### Test

```sh
npm test --- tv.magenta.at
```
