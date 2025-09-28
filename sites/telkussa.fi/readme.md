# telkussa.fi

https://telkussa.fi/

### Download the guide

```sh
npm run grab --- --site=telkussa.fi
```

### Update channel list

```sh
npm run channels:parse --- --config=./sites/telkussa.fi/telkussa.fi.config.js --output=./sites/telkussa.fi/telkussa.fi.channels.xml
```

### Test

```sh
npm test --- telkussa.fi
```
