# i.mjh.nz

| Provider        | Code          | URL                            |
| --------------- | ------------- | ------------------------------ |
| Australia       | `au`          | https://i.mjh.nz/au            |
| Binge           | `binge`       | https://i.mjh.nz/Binge         |
| DStv            | `dstv`        | https://i.mjh.nz/DStv          |
| Flash           | `flash`       | https://i.mjh.nz/Flash         |
| Foxtel          | `foxtel`      | https://i.mjh.nz/Foxtel        |
| HGTV GO         | `hgtvgo`      | https://i.mjh.nz/hgtv_go       |
| Kayo            | `kayo`        | https://i.mjh.nz/Kayo          |
| MeTV            | `metv`        | https://i.mjh.nz/MeTV          |
| New Zealand     | `nz`          | https://i.mjh.nz/nz            |
| Optus           | `optus`       | https://i.mjh.nz/Optus         |
| PBS             | `pbs`         | https://i.mjh.nz/PBS           |
| Plex            | `plex`        | https://i.mjh.nz/Plex          |
| Pluto TV        | `pluto`       | https://i.mjh.nz/PlutoTV       |
| Roku            | `roku`        | https://i.mjh.nz/Roku          |
| Samsung TV Plus | `samsung`     | https://i.mjh.nz/SamsungTVPlus |
| Singtel         | `singtel`     | https://i.mjh.nz/Singtel       |
| SkyGo           | `skygo`       | https://i.mjh.nz/SkyGo         |
| Sky Sport Now   | `skysportnow` | https://i.mjh.nz/SkySportNow   |
| STIRR           | `stirr`       | https://i.mjh.nz/Stirr         |

| Provider | Code |

### Download the guide

```sh
npm run grab --- --channels=sites/i.mjh.nz/i.mjh.nz_<PROVIDER_CODE>.channels.xml
```

### Update channel list

```sh
npm run channels:parse --- --config=./sites/i.mjh.nz/i.mjh.nz.config.js --output=./sites/i.mjh.nz/i.mjh.nz_<PROVIDER_CODE>.channels.xml --set=provider:<PROVIDER_CODE>
```

### Test

```sh
npm test --- i.mjh.nz
```
