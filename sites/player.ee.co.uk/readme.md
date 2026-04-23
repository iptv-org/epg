# player.ee.co.uk

https://player.ee.co.uk/#/livetv/schedule

### Download the guide

```sh
npm run grab --- --sites=player.ee.co.uk
```

### Update channel list

```sh
npm run channels:parse --- --config=./sites/player.ee.co.uk/player.ee.co.uk.config.js --output=./sites/player.ee.co.uk/player.ee.co.uk.channels.xml
```

### Test

```sh
npm test --- player.ee.co.uk
```
