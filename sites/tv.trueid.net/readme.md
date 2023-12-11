# tv.trueid.net

https://tv.trueid.net/

### Download the guide

Thai:

```sh
npm run grab -- --site=tv.trueid.net --lang=th
```

English:

```sh
npm run grab -- --site=tv.trueid.net --lang=en
```

### Update channel list

Thai:

```sh
npm run channels:parse -- --config=./sites/tv.trueid.net/tv.trueid.net.config.js --output=./sites/tv.trueid.net/tv.trueid.net_th.channels.xml --set=lang:th
```

English:

```sh
npm run channels:parse -- --config=./sites/tv.trueid.net/tv.trueid.net.config.js --output=./sites/tv.trueid.net/tv.trueid.net_en.channels.xml --set=lang:en
```

### Test

```sh
npm test -- tv.trueid.net
```
