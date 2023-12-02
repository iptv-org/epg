# unifi.com.my

https://playtv.unifi.com.my/EPG/WEBTV/index.html#/tvguide

### Download the guide

```sh
npm run grab -- --site=unifi.com.my
```

### Update channel list

```sh
npm run channels:parse -- --config=./sites/unifi.com.my/unifi.com.my.config.js --output=./sites/unifi.com.my/unifi.com.my.channels.xml
```

### Test

```sh
npm test -- unifi.com.my
```
