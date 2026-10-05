# mi.tv

| Country     | Code | URL                           |
| ----------- | ---- | ----------------------------- |
| Argentina   | `ar` | https://mi.tv/ar/programacion |
| Brazil      | `br` | https://mi.tv/br/programacao  |
| Chile       | `cl` | https://mi.tv/cl/programacion |
| Colombia    | `co` | https://mi.tv/co/programacion |
| El Salvador | `sv` | https://mi.tv/sv/programacion |
| Guatemala   | `gt` | https://mi.tv/gt/programacion |
| Honduras    | `hn` | https://mi.tv/hn/programacion |
| Mexico      | `mx` | https://mi.tv/mx/programacion |
| Paraguay    | `py` | https://mi.tv/py/programacion |
| Peru        | `pe` | https://mi.tv/pe/programacion |

### Download the guide

```sh
npm run grab --- --channels=sites/mi.tv/mi.tv_<COUNTRY_CODE>.channels.xml
```

### Update channel list

```sh
npm run channels:parse --- --config=./sites/mi.tv/mi.tv.config.js --output=./sites/mi.tv/mi.tv_<COUNTRY_CODE>.channels.xml --set=country:<COUNTRY_CODE>
```

### Test

```sh
npm test --- mi.tv
```
