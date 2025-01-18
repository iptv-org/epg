# vivoplay.com.br

https://www.vivoplay.com.br/tv-guide/epg

### Download the guide

```sh
npm run grab --- --site=vivoplay.com.br
```

### Update channel list

```sh
npm run channels:parse --- --config=./sites/vivoplay.com.br/vivoplay.com.br.config.js --output=./sites/vivoplay.com.br/vivoplay.com.br.channels.xml
```

### Test

```sh
npm test --- vivoplay.com.br
```
