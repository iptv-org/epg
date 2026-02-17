# skylife.co.kr

https://www.skylife.co.kr/product/tv/channelNo/chart

### Download the guide

```sh
npm run grab --- --site=skylife.co.kr
```

### Update channel list

```sh
npm run channels:parse --- --config=./sites/skylife.co.kr/skylife.co.kr.config.js --output=./sites/skylife.co.kr/skylife.co.kr.channels.xml
```

### Test

```sh
npm test --- skylife.co.kr
```
