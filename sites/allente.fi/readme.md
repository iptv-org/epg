# allente.fi

https://www.allente.fi/tv-guide/

### Download the guide

```sh
npm run grab --- --site=allente.fi
```

### Update channel list

```sh
npm run channels:parse --- --config=./sites/allente.fi/allente.fi.config.js --output=./sites/allente.fi/allente.fi.channels.xml
```

### Test

```sh
npm test --- allente.fi
```
