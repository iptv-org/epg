# mtel.ba

| Platform | Code   | URL                                                   |
| -------- | ------ | ----------------------------------------------------- |
| m:SAT    | `msat` | https://mtel.ba/Televizija/TV-ponuda/TV-vodic#tv-msat |
| IPTV     | `iptv` | https://mtel.ba/Televizija/TV-ponuda/TV-vodic#tv-iptv |

### Download the guide

```sh
npm run grab --- --channels=sites/mtel.ba/mtel.ba_<PLATFORM_CODE>.channels.xml
```

### Update channel list

```sh
npm run channels:parse --- --config=./sites/mtel.ba/mtel.ba.config.js --output=./sites/mtel.ba/mtel.ba_<PLATFORM_CODE>.channels.xml --set=platform:<PLATFORM_CODE>
```

### Test

```sh
npm test --- mtel.ba
```
