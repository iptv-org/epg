# claro.com.br

https://www.claro.com.br/tv-por-assinatura/programacao/grade

### Download the guide

```sh
npm run grab --- --site=claro.com.br
```

### Update channel list

```sh
npm run channels:parse --- --config=./sites/claro.com.br/claro.com.br.config.js --output=./sites/claro.com.br/claro.com.br.channels.xml
```

### Test

```sh
npm test --- claro.com.br
```
