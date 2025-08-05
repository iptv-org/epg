# canalplus.com

| Country                  | Code | URL                                        |
| ------------------------ | ---- | ------------------------------------------ |
| Andorra                  | `ad` | https://www.canalplus.com/ad/programme-tv/ |
| Benign                   | `bj` | https://www.canalplus.com/bj/programme-tv/ |
| Burkina Faso             | `bf` | https://www.canalplus.com/bf/programme-tv/ |
| Burundi                  | `bi` | https://www.canalplus.com/bi/programme-tv/ |
| Cabo Verde               | `cv` | https://www.canalplus.com/cv/programme-tv/ |
| Cameroon                 | `cm` | https://www.canalplus.com/cm/programme-tv/ |
| Central African Republic | `cf` | https://www.canalplus.com/cf/programme-tv/ |
| Chad                     | `td` | https://www.canalplus.com/td/programme-tv/ |
| Congo                    | `cg` | https://www.canalplus.com/cg/programme-tv/ |
| Djibouti                 | `dj` | https://www.canalplus.com/dj/programme-tv/ |
| DRC                      | `cd` | https://www.canalplus.com/cd/programme-tv/ |
| Equatorial Guinea        | `gp` | https://www.canalplus.com/gp/programme-tv/ |
| France                   | `fr` | https://www.canalplus.com/programme-tv/    |
| French Guiana            | `gf` | https://www.canalplus.com/gf/programme-tv/ |
| French Polynesia         | `pf` | https://www.canalplus.com/pf/programme-tv/ |
| Gabon                    | `ga` | https://www.canalplus.com/ga/programme-tv/ |
| Gambia                   | `gm` | https://www.canalplus.com/gm/programme-tv/ |
| Ghana                    | `gh` | https://www.canalplus.com/gh/programme-tv/ |
| Guinea-Bissau            | `gw` | https://www.canalplus.com/gw/programme-tv/ |
| Guinea                   | `gn` | https://www.canalplus.com/gn/programme-tv/ |
| Haiti                    | `ht` | https://www.canalplus.com/ht/programme-tv/ |
| Ivory Coast              | `ci` | https://www.canalplus.com/ci/programme-tv/ |
| Madagascar               | `mg` | https://www.canalplus.com/mg/programme-tv/ |
| Mali                     | `ml` | https://www.canalplus.com/ml/programme-tv/ |
| Martinique               | `mq` | https://www.canalplus.com/mq/programme-tv/ |
| Mauritania               | `mr` | https://www.canalplus.com/mr/programme-tv/ |
| Mauritius                | `mu` | https://www.canalplus.com/mu/programme-tv/ |
| Mayotte                  | `yt` | https://www.canalplus.com/yt/programme-tv/ |
| New Caledonia            | `nc` | https://www.canalplus.com/nc/programme-tv/ |
| Niger                    | `ne` | https://www.canalplus.com/ne/programme-tv/ |
| Poland                   | `pl` | https://www.canalplus.com/pl/programme-tv/ |
| Rwanda                   | `rw` | https://www.canalplus.com/rw/programme-tv/ |
| Réunion                  | `re` | https://www.canalplus.com/re/programme-tv/ |
| Saint Barthélemy         | `bl` | https://www.canalplus.com/bl/programme-tv/ |
| Saint-Martin             | `mf` | https://www.canalplus.com/mf/programme-tv/ |
| Senegal                  | `sn` | https://www.canalplus.com/sn/programme-tv/ |
| Sierra Leone             | `sl` | https://www.canalplus.com/sl/programme-tv/ |
| Switzerland              | `ch` | https://www.canalplus.com/ch/programme-tv/ |
| Togo                     | `tg` | https://www.canalplus.com/tg/programme-tv/ |
| Wallis and Futuna        | `wf` | https://www.canalplus.com/wf/programme-tv/ |

### Download the guide

```sh
npm run grab --- --channels=sites/canalplus.com/canalplus.com_<COUNTRY_CODE>.channels.xml
```

### Update channel list

```sh
npm run channels:parse --- --config=./sites/canalplus.com/canalplus.com.config.js --output=./sites/canalplus.com/canalplus.com_<COUNTRY_CODE>.channels.xml --set=country:<COUNTRY_CODE>
```

### Test

```sh
npm test --- canalplus.com
```
