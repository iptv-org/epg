# nostv.pt

https://nostv.pt/guia/

### Download the guide

```sh
npm run grab --- --site=nostv.pt
```

### Update channel list

```sh
npm run channels:parse --- --config=./sites/nostv.pt/nostv.pt.config.js --output=./sites/nostv.pt/nostv.pt.channels.xml
```

### Test

```sh
npm test --- nostv.pt
```
