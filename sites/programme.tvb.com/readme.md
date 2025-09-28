# programme.tvb.com

https://www.programme.tvb.com/

### Download the guide

English:

```sh
npm run grab --- --site=programme.tvb.com --lang=en
```

Chinese:

```sh
npm run grab --- --site=programme.tvb.com --lang=zh
```

### Update channel list

English:

```sh
npm run channels:parse --- --config=sites/programme.tvb.com/programme.tvb.com.config.js --output=sites/programme.tvb.com/programme.tvb.com_en.channels.xml --set=lang:en
```

Chinese:

```sh
npm run channels:parse --- --config=sites/programme.tvb.com/programme.tvb.com.config.js --output=sites/programme.tvb.com/programme.tvb.com_zh.channels.xml --set=lang:zh
```

### Test

```sh
npm test --- programme.tvb.com
```
