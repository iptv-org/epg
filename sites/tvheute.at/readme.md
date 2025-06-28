# tvheute.at

https://tvheute.at/

### Download the guide

```sh
npm run grab --- --site=tvheute.at
```

### Update channel list

```sh
npm run channels:parse --- --config=./sites/tvheute.at/tvheute.at.config.js --output=./sites/tvheute.at/tvheute.at.channels.xml
```

### Test

```sh
npm test --- tvheute.at
```
