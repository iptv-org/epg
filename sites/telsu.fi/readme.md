# telsu.fi

https://www.telsu.fi/

### Download the guide

```sh
npm run grab --- --site=telsu.fi
```

### Update channel list

```sh
npm run channels:parse --- --config=./sites/telsu.fi/telsu.fi.config.js --output=./sites/telsu.fi/telsu.fi.channels.xml
```

### Test

```sh
npm test --- telsu.fi
```
