# iltalehti.fi

https://www.iltalehti.fi/telkku/

### Download the guide

```sh
npm run grab --- --site=iltalehti.fi
```

### Update channel list

```sh
npm run channels:parse --- --config=./sites/iltalehti.fi/iltalehti.fi.config.js --output=./sites/iltalehti.fi/iltalehti.fi.channels.xml
```

### Test

```sh
npm test --- iltalehti.fi
```
