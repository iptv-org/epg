# tvmusor.hu

https://tvmusor.hu/schedule/

### Download the guide

```sh
npm run grab --- --site=tvmusor.hu
```

### Update channel list

```sh
npm run channels:parse --- --config=./sites/tvmusor.hu/tvmusor.hu.config.js --output=./sites/tvmusor.hu/tvmusor.hu.channels.xml
```

### Test

```sh
npm test --- tvmusor.hu
```
