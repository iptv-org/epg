# mytvsuper.com

https://www.mytvsuper.com/tc/epg/ (Chinese)

https://www.mytvsuper.com/en/epg/ (English)

### Download the guide

Chinese:

```sh
npm run grab --- --site=mytvsuper.com --lang=zh
```

English:

```sh
npm run grab --- --site=mytvsuper.com --lang=en
```

### Update channel list

Chinese:

```sh
npm run channels:parse --- --config=./sites/mytvsuper.com/mytvsuper.com.config.js --output=./sites/mytvsuper.com/mytvsuper.com_zh.channels.xml --set=lang:zh
```

English:

```sh
npm run channels:parse --- --config=./sites/mytvsuper.com/mytvsuper.com.config.js --output=./sites/mytvsuper.com/mytvsuper.com_en.channels.xml --set=lang:en
```

### Test

```sh
npm test --- mytvsuper.com
```
