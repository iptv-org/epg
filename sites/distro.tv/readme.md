# distro.tv

https://distro.tv

### Download the guide

```sh
npm run grab --- --site=distro.tv
```

### Update channel list (varies based on region/IP)

```sh
npm run channels:parse --- --config=./sites/distro.tv/distro.tv.config.js --output=./sites/distro.tv/distro.tv.channels.xml
```

### Test

```sh
npm test --- distro.tv
```