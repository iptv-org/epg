# cyta.com.cy

https://epg.cyta.com.cy/tv-guide/el

### Download the guide

```sh
npm run grab --- --site=cyta.com.cy
```

### Update channel list

```sh
npm run channels:parse --- --config=./sites/cyta.com.cy/cyta.com.cy.config.js --output=./sites/cyta.com.cy/cyta.com.cy.channels.xml
```

### Test

```sh
npm test --- cyta.com.cy
```
