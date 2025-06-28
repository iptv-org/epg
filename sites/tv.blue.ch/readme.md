# tv.blue.ch

https://tv.blue.ch/tv-guide

### Download the guide

```sh
npm run grab --- --site=tv.blue.ch
```

### Update channel list

```sh
npm run channels:parse --- --config=./sites/tv.blue.ch/tv.blue.ch.config.js --output=./sites/tv.blue.ch/tv.blue.ch.channels.xml
```

### Test

```sh
npm test --- tv.blue.ch
```
