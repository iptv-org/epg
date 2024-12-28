# tvpassport.com

https://www.tvpassport.com/tv-listings

### Download the guide

```sh
npm run grab --- --site=tvpassport.com
```

### Update channel list

```sh
npm run channels:parse --- --config=./sites/tvpassport.com/tvpassport.com.config.js --output=./sites/tvpassport.com/tvpassport.com.channels.xml
```

### Test

```sh
npm test --- tvpassport.com
```
