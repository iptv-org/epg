# syn.is

https://www.syn.is/sjonvarp/dagskra

### Download the guide

```sh
npm run grab --- --site=syn.is
```

### Update channel list

```sh
npm run channels:parse --- --config=./sites/syn.is/syn.is.config.js --output=./sites/syn.is/syn.is.channels.xml
```

### Test

```sh
npm test --- syn.is
```
