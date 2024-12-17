# watch.sportsnet.ca

https://watch.sportsnet.ca/schedule/tvlistings

### Download the guide

```sh
npm run grab --- --site=watch.sportsnet.ca
```

### Update channel list

```sh
npm run channels:parse --- --config=./sites/watch.sportsnet.ca/watch.sportsnet.ca.config.js --output=./sites/watch.sportsnet.ca/watch.sportsnet.ca.channels.xml
```

### Test

```sh
npm test --- watch.sportsnet.ca
```
