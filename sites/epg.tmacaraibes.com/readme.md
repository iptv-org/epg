# epg.tmacaraibes.com

http://epg.tmacaraibes.com/Epg/xmltv.xml

### Download the guide

```sh
npm run grab --- --sites=epg.tmacaraibes.com
```

### Update channel list

```sh
npm run channels:parse --- --config=./sites/epg.tmacaraibes.com/epg.tmacaraibes.com.config.js --output=./sites/epg.tmacaraibes.com/epg.tmacaraibes.com.channels.xml
```

### Test

```sh
npm test --- epg.tmacaraibes.com
```
