# allente.no

https://www.allente.no/tv-guide/

### Available countries

no = Norway
fi = Finland
dk = Danemark
se = Sweden

### Download the guide

```sh
npm run grab --- --site=allente.no
```

### Update channel list

```sh
npm run channels:parse --- --config=./sites/allente.no/allente.no.config.js --output=./sites/allente.no/allente.no_<COUNTRY>.channels.xml --set=country:<COUNTRY>
```

### Test

```sh
npm test --- allente.no
```
