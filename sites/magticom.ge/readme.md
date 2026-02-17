# magticom.ge

https://www.magticom.ge/ka/tv/ip-tv/tv-guide

### Download the guide

```sh
npm run grab --- --site=magticom.ge
```

### Update channel list

```sh
npm run channels:parse --- --config=./sites/magticom.ge/magticom.ge.config.js --output=./sites/magticom.ge/magticom.ge.channels.xml
```

### Test

```sh
npm test --- magticom.ge
```
