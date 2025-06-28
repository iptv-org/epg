# tv.dir.bg

https://tv.dir.bg/programata.php

### Download the guide

```sh
npm run grab --- --site=tv.dir.bg
```

### Update channel list

```sh
npm run channels:parse --- --config=./sites/tv.dir.bg/tv.dir.bg.config.js --output=./sites/tv.dir.bg/tv.dir.bg.channels.xml
```

### Test

```sh
npm test --- tv.dir.bg
```
