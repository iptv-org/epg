# mytelly.co.uk

https://www.mytelly.co.uk/tv-guide/

### Download the guide

```sh
npm run grab --- --site=mytelly.co.uk
```

### Update channel list

```sh
npm run channels:parse --- --config=./sites/mytelly.co.uk/mytelly.co.uk.config.js --output=./sites/mytelly.co.uk/mytelly.co.uk.channels.xml
```

### Test

```sh
npm test --- mytelly.co.uk
```
