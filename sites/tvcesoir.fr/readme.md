# tvcesoir.fr

https://www.tvcesoir.fr/programme-tv/

### Download the guide

```sh
npm run grab --- --site=tvcesoir.fr
```

### Update channel list

```sh
npm run channels:parse --- --config=./sites/tvcesoir.fr/tvcesoir.fr.config.js --output=./sites/tvcesoir.fr/tvcesoir.fr.channels.xml
```

### Test

```sh
npm test --- tvcesoir.fr
```
