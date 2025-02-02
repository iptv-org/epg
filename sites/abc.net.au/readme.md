# abc.net.au

https://www.abc.net.au/tv/epg/

| Region             | Code  |
| ------------------ | ----- |
| Sydney             | `syd` |
| Melbourne          | `mel` |
| Brisbane           | `bri` |
| Gold Coast         | `gc`  |
| Perth              | `per` |
| Adelaide           | `adl` |
| Hobart             | `hbr` |
| Darwin             | `drw` |
| Canberra           | `cbr` |
| New South Wales    | `nsw` |
| Victoria           | `vic` |
| Townsville         | `tsv` |
| Queensland         | `qld` |
| Western Australia  | `wa`  |
| South Australia    | `sa`  |
| Tasmania           | `tas` |
| Northern Territory | `nt`  |

### Download the guide

```sh
npm run grab --- --channels=sites/abc.net.au/abc.net.au_<REGION_CODE>.channels.xml
```

### Update channel list

```sh
npm run channels:parse --- --config=./sites/abc.net.au/abc.net.au.config.js --output=./sites/abc.net.au/abc.net.au_<REGION_CODE>.channels.xml --set=region:<REGION_CODE>
```

### Test

```sh
npm test --- abc.net.au
```
