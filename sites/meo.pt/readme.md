# meo.pt

https://www.meo.pt/tv/canais-programacao/guia-tv

### Download the guide

```sh
npm run grab --- --sites=meo.pt
```

### Update channel list

```sh
npm run channels:parse --- --config=./sites/meo.pt/meo.pt.config.js --output=./sites/meo.pt/meo.pt.channels.xml
```

### Test

```sh
npm test --- meo.pt
```
