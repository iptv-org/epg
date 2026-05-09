# www.tv-tokyo.co.jp

https://www.tv-tokyo.co.jp/timetable/

### Download the guide

```sh
npm run grab --- --sites=www.tv-tokyo.co.jp
```

### Update channel list

```sh
npm run channels:parse --- --config=./sites/www.tv-tokyo.co.jp/www.tv-tokyo.co.jp.config.js --output=./sites/www.tv-tokyo.co.jp/www.tv-tokyo.co.jp.channels.xml
```

### Test

```sh
npm test --- www.tv-tokyo.co.jp
```
