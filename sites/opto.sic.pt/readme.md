# opto.sic.pt

https://opto.sic.pt/guia-tv

### Download the guide

```sh
npm run grab --- --site=opto.sic.pt
```

### Update channel list

```sh
npm run channels:parse --- --config=./sites/opto.sic.pt/opto.sic.pt.config.js --output=./sites/opto.sic.pt/opto.sic.pt.channels.xml
```

### Test

```sh
npm test --- opto.sic.pt
```
