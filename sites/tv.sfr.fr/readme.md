# tv.sfr.fr

https://tv.sfr.fr/programme-tv

### Download the guide

```sh
npm run grab --- --site=tv.sfr.fr
```

### Update channel list

```sh
npm run channels:parse --- --config=./sites/tv.sfr.fr/tv.sfr.fr.config.js --output=./sites/tv.sfr.fr/tv.sfr.fr.channels.xml
```

### Test

```sh
npm test --- tv.sfr.fr
```
