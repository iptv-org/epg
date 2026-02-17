# mewatch.sg

https://www.mewatch.sg/channel-guide

### Download the guide

```sh
npm run grab --- --site=mewatch.sg
```

### Update channel list

```sh
npm run channels:parse --- --config=./sites/mewatch.sg/mewatch.sg.config.js --output=./sites/mewatch.sg/mewatch.sg.channels.xml
```

### Test

```sh
npm test --- mewatch.sg
```
