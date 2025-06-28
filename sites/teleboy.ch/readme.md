# teleboy.ch [Geo-blocked]

https://www.teleboy.ch/programm

### Download the guide

```sh
npm run grab --- --site=teleboy.ch
```

### Update channel list

```sh
npm run channels:parse --- --config=./sites/teleboy.ch/teleboy.ch.config.js --output=./sites/teleboy.ch/teleboy.ch.channels.xml
```

### Test

```sh
npm test --- teleboy.ch
```
