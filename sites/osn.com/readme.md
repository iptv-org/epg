# osn.com

https://osn.com/ _[Geo-blocked]_

### Download the guide

Arabic:

```sh
npm run grab --- --site=osn.com --lang=ar
```

English:

```sh
npm run grab --- --site=osn.com --lang=en
```

### Update channel list

Arabic:

```sh
npm run channels:parse --- --config=./sites/osn.com/osn.com.config.js --output=./sites/osn.com/osn.com_ar.channels.xml --set=lang:ar
```

English:

```sh
npm run channels:parse --- --config=./sites/osn.com/osn.com.config.js --output=./sites/osn.com/osn.com_en.channels.xml --set=lang:en
```

### Test

```sh
npm test --- osn.com
```
