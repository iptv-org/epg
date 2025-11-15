# port.hu

https://port.hu/tv

### Download the guide

```sh
npm run grab --- --site=port.hu --delay=1000
```

**IMPORTANT:** Keep in mind that with a large number of requests the server may start responding with the error [429 Too Many Requests](https://developer.mozilla.org/en-US/docs/Web/HTTP/Status/429). In this case, try increasing the `--delay` (1000 = 1 second) or create a [custom channel list](https://github.com/iptv-org/epg?tab=readme-ov-file#use-custom-channel-list) with only the channels you need.

### Update channel list

```sh
npm run channels:parse --- --config=./sites/port.hu/port.hu.config.js --output=./sites/port.hu/port.hu.channels.xml
```

### Test

```sh
npm test --- port.hu
```
