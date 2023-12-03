# nos.pt

https://nostv.pt/guia/

### Download the guide

```sh
npm run grab -- --site=nos.pt
```

### Update channel list

```sh
npm run channels:parse -- --config=./sites/nos.pt/nos.pt.config.js --output=./sites/nos.pt/nos.pt.channels.xml
```

### Test

```sh
npm test -- nos.pt
```
