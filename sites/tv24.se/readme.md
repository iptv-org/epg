# tv24.se

https://tv24.se/

### Download the guide

```sh
npm run grab --- --site=tv24.se
```

### Update channel list

```sh
npm run channels:parse --- --config=./sites/tv24.se/tv24.se.config.js --output=./sites/tv24.se/tv24.se.channels.xml
```

### Test

```sh
npm test --- tv24.se
```
