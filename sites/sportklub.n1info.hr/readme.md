# sportklub.n1info.hr

https://sportklub.n1info.hr/tv-program/

Sport Klub (Croatia). The page renders its schedule with a United Cloud "chameleon-epg"
widget backed by United Group's public EPG API (the same backend as EON), which this config
calls directly: an OAuth client-credentials token, then
`/v1/public/events/epg?cid=&fromTime=&toTime=&communityIdentifier=sk_hr&languageId=181`.

### Download the guide

```sh
npm run grab --- --sites=sportklub.n1info.hr
```

### Update channel list

```sh
npm run channels:parse --- --config=./sites/sportklub.n1info.hr/sportklub.n1info.hr.config.js --output=./sites/sportklub.n1info.hr/sportklub.n1info.hr.channels.xml
```

### Test

```sh
npm test --- sportklub.n1info.hr
```
