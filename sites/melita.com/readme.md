# melita.com

https://www.melita.com/tv-schedule/

### Download the guide

```sh
npm run grab --- --site=melita.com
```

### Update channel list

```sh
npm run channels:parse --- --config=./sites/melita.com/melita.com.config.js --output=./sites/melita.com/melita.com.channels.xml
```

### Test

```sh
npm test --- melita.com
```
