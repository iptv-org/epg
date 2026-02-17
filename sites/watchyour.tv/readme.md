# watchyour.tv

https://watchyour.tv/tvexperience.php

### Download the guide

```sh
npm run grab --- --site=watchyour.tv
```

### Update channel list

```sh
npm run channels:parse --- --config=./sites/watchyour.tv/watchyour.tv.config.js --output=./sites/watchyour.tv/watchyour.tv.channels.xml
```

### Test

```sh
npm test --- watchyour.tv
```
