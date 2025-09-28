# maxtvgo.mk

https://maxtvgo.mk/epg

### Download the guide

```sh
npm run grab --- --site=maxtvgo.mk
```

### Update channel list

```sh
npm run channels:parse --- --config=./sites/maxtvgo.mk/maxtvgo.mk.config.js --output=./sites/maxtvgo.mk/maxtvgo.mk.channels.xml
```

### Test

```sh
npm test --- maxtvgo.mk
```
