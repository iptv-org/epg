# x1co.com.br

https://x1co.com.br/epg/epg.xml

### Download the guide

```sh
npm run grab --- --sites=x1co.com.br
```

### Update channel list

```sh
npm run channels:parse --- --config=./sites/x1co.com.br/x1co.com.br.config.js --output=./sites/x1co.com.br/x1co.com.br.channels.xml
```

### Test

```sh
npm test --- x1co.com.br
```
