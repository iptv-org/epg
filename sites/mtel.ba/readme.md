# mtel.ba

https://mtel.ba/Televizija/TV-ponuda/TV-vodic

### Download the guide

```sh
npm run grab --- --site=mtel.ba
```

### Update channel list

```sh
npm run channels:parse --- --config=./sites/mtel.ba/mtel.ba.config.js --output=./sites/mtel.ba/mtel.ba.channels.xml
```

### Test

```sh
npm test --- mtel.ba
```
