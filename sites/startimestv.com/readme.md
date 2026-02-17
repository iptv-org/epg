# startimestv.com

https://startimestv.com/tv_guide.html

### Download the guide

```sh
npm run grab --- --site=startimestv.com
```

### Update channel list

```sh
npm run channels:parse --- --config=./sites/startimestv.com/startimestv.com.config.js --output=./sites/startimestv.com/startimestv.com.channels.xml
```

### Test

```sh
npm test --- startimestv.com
```
