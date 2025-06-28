# starhubtvplus.com

https://www.starhubtvplus.com/

### Download the guide

English:

```sh
npm run grab --- --site=starhubtvplus.com --lang=en
```

Chinese:

```sh
npm run grab --- --site=starhubtvplus.com --lang=zh
```

### Update channel list

English:

```sh
npm run channels:parse --- --config=sites/starhubtvplus.com/starhubtvplus.com.config.js --output=sites/starhubtvplus.com/starhubtvplus.com_en.channels.xml --set=lang:en
```

Chinese:

```sh
npm run channels:parse --- --config=sites/starhubtvplus.com/starhubtvplus.com.config.js --output=sites/starhubtvplus.com/starhubtvplus.com_zh.channels.xml --set=lang:zh
```

### Test

```sh
npm test --- starhubtvplus.com
```
