# france.tv

https://www.france.tv/

### Download the guide

```sh
npm run grab --- --site=france.tv
```

### Update channel list

```sh
npm run channels:parse --- --config=./sites/france.tv/france.tv.config.js --output=./sites/france.tv/france.tv.channels.xml
```

### Test

```sh
npm test --- france.tv
```
