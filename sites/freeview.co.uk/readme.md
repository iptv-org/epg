# freeview.co.uk

https://www.freeview.co.uk/tv-guide

### Download the guide

```sh
npm run grab --- --site=freeview.co.uk
```

### Update channel list

```sh
npm run channels:parse --- --config=./sites/freeview.co.uk/freeview.co.uk.config.js --output=./sites/freeview.co.uk/freeview.co.uk.channels.xml
```

### Test

```sh
npm test --- freeview.co.uk
```
