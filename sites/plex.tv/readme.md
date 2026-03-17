# plex.tv

https://watch.plex.tv/live-tv

### Download the guide

```sh
npm run grab --- --site=plex.tv
```

### Update channel list (varies according to IP address/region)

Each channel appears in only one `xml` file to avoid overlaps. Global channels are grouped in `*_all.channels.xml`.

```sh
npm run channels:parse --- --config=./sites/plex.tv/plex.tv.config.js --output=./sites/plex.tv/plex.tv.channels.xml --set=token:YOUR_PLEX_TOKEN
```

Where to get the Plex Token? https://www.plexopedia.com/plex-media-server/general/plex-token/

### Test

```sh
npm test --- plex.tv
```
