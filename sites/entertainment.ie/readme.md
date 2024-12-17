# entertainment.ie

https://entertainment.ie/tv/all-channels/

### Download the guide

```sh
npm run grab --- --site=entertainment.ie
```

### Update channel list

```sh
npm run channels:parse --- --config=./sites/entertainment.ie/entertainment.ie.config.js --output=./sites/entertainment.ie/entertainment.ie.channels.xml
```

### Test

```sh
npm test --- entertainment.ie
```
