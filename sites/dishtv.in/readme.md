# dishtv.in

https://www.dishtv.in/channelguide/

### Download the guide

```sh
npm run grab --- --site=dishtv.in
```

### Update channel list

```sh
npm run channels:parse --- --config=./sites/dishtv.in/dishtv.in.config.js --output=./sites/dishtv.in/dishtv.in.channels.xml
```

### Test

```sh
npm test --- dishtv.in
```
