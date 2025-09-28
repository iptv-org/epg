# nowplayer.now.com

https://nowplayer.now.com/tvguide

### Download the guide

Chinese:

```sh
npm run grab --- --site=nowplayer.now.com  --lang=zh
```

English:

```sh
npm run grab --- --site=nowplayer.now.com  --lang=en
```

### Update channel list

Chinese:

```sh
npm run channels:parse --- --config=./sites/nowplayer.now.com/nowplayer.now.com.config.js --output=./sites/nowplayer.now.com/nowplayer.now.com_zh.channels.xml --set=lang:zh
```

English:

```sh
npm run channels:parse --- --config=./sites/nowplayer.now.com/nowplayer.now.com.config.js --output=./sites/nowplayer.now.com/nowplayer.now.com_en.channels.xml --set=lang:en
```

### Test

```sh
npm test --- nowplayer.now.com
```
