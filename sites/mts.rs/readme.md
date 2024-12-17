# mts.rs

https://mts.rs/tv-vodic/epg

### Download the guide

```sh
npm run grab --- --site=mts.rs
```

### Update channel list

```sh
npm run channels:parse --- --config=./sites/mts.rs/mts.rs.config.js --output=./sites/mts.rs/mts.rs.channels.xml
```

### Test

```sh
npm test --- mts.rs
```
