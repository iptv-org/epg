# gatotv.com

https://www.gatotv.com/guia_tv/completa

### Download the guide

```sh
npm run grab --- --site=gatotv.com
```

### Update channel list

```sh
npm run channels:parse --- --config=./sites/gatotv.com/gatotv.com.config.js --output=./sites/gatotv.com/gatotv.com.channels.xml
```

### Test

```sh
npm test --- gatotv.com
```
