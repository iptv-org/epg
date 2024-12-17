# maxtv.hrvatskitelekom.hr

https://maxtv.hrvatskitelekom.hr/#/epg

### Download the guide

```sh
npm run grab --- --site=maxtv.hrvatskitelekom.hr
```

### Update channel list

```sh
npm run channels:parse --- --config=./sites/maxtv.hrvatskitelekom.hr/maxtv.hrvatskitelekom.hr.config.js --output=./sites/maxtv.hrvatskitelekom.hr/maxtv.hrvatskitelekom.hr.channels.xml
```

### Test

```sh
npm test --- maxtv.hrvatskitelekom.hr
```
