# epg.i-cable.com

https://epg.i-cable.com/

### Download the guide

Chinese:

```sh
npm run grab -- --site=epg.i-cable.com --lang=zh
```

English:

```sh
npm run grab -- --site=epg.i-cable.com --lang=en
```

### Update channel list

Chinese:

```sh
npm run channels:parse -- --config=./sites/epg.i-cable.com/epg.i-cable.com.config.js --output=./sites/epg.i-cable.com/epg.i-cable.com_zh.channels.xml --set=lang:zh
```

English:

```sh
npm run channels:parse -- --config=./sites/epg.i-cable.com/epg.i-cable.com.config.js --output=./sites/epg.i-cable.com/epg.i-cable.com_en.channels.xml --set=lang:en
```

### Test

```sh
npm test -- epg.i-cable.com
```
