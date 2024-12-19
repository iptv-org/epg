# tv.nu

https://www.tv.nu/alla-kanaler

### Download the guide

```sh
npm run grab --- --site=tv.nu
```

### Update channel list

```sh
npm run channels:parse --- --config=./sites/tv.nu/tv.nu.config.js --output=./sites/tv.nu/tv.nu.channels.xml
```

### Test

```sh
npm test --- tv.nu
```
