# sky.de

https://www.sky.de/tvguide-7599

### Download the guide

```sh
npm run grab --- --site=sky.de
```

### Update channel list

```sh
npm run channels:parse --- --config=./sites/sky.de/sky.de.config.js --output=./sites/sky.de/sky.de.channels.xml
```

### Test

```sh
npm test --- sky.de
```
