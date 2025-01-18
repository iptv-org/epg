# guiadetv.com

https://www.guiadetv.com/programacao/

### Download the guide

```sh
npm run grab --- --site=guiadetv.com
```

### Update channel list

```sh
npm run channels:parse --- --config=./sites/guiadetv.com/guiadetv.com.config.js --output=./sites/guiadetv.com/guiadetv.com.channels.xml
```

### Test

```sh
npm test --- guiadetv.com
```
