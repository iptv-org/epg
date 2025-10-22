# webtv.delta.nl

https://webtv.delta.nl/#/guide

### Download the guide

```sh
npm run grab --- --site=webtv.delta.nl
```

### Update channel list

```sh
npm run channels:parse --- --config=./sites/webtv.delta.nl/webtv.delta.nl.config.js --output=./sites/webtv.delta.nl/webtv.delta.nl.channels.xml
```

### Test

```sh
npm test --- webtv.delta.nl
```
