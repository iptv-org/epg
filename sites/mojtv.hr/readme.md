# mojtv.hr

https://mojtv.hr/tv-program/-1/hrvatski/danas.aspx

Croatian TV guide (server-rendered). Each channel has a per-day page at
`/kanal/tv-program/<id>/<slug>/<YYYY-MM-DD>.aspx` (the slug is ignored by the routing).
Rows carry an `<a class="show" rel="START-STOP">` with full local (Europe/Zagreb) datetimes.

### Download the guide

```sh
npm run grab --- --sites=mojtv.hr
```

### Update channel list

```sh
npm run channels:parse --- --config=./sites/mojtv.hr/mojtv.hr.config.js --output=./sites/mojtv.hr/mojtv.hr.channels.xml
```

### Test

```sh
npm test --- mojtv.hr
```
