# dstv.com

| Country                  | Code | URL                                         |
| ------------------------ | ---- | ------------------------------------------- |
| Angola                   | `ao` | https://www.dstv.com/en-ao/explore/tv-guide |
| Benin                    | `bj` | https://www.dstv.com/en-bj/explore/tv-guide |
| Botswana                 | `bw` | https://www.dstv.com/en-bw/explore/tv-guide |
| Burkina Faso             | `bf` | https://www.dstv.com/en-bf/explore/tv-guide |
| Burundi                  | `bi` | https://www.dstv.com/en-bi/explore/tv-guide |
| Cameroon                 | `cm` | https://www.dstv.com/en-cm/explore/tv-guide |
| Cape Verde               | `cv` | https://www.dstv.com/en-cv/explore/tv-guide |
| Chad                     | `td` | https://www.dstv.com/en-td/explore/tv-guide |
| Central African Republic | `cf` | https://www.dstv.com/en-cf/explore/tv-guide |
| Comoros                  | `km` | https://www.dstv.com/en-km/explore/tv-guide |
| DRC                      | `cd` | https://www.dstv.com/en-cd/explore/tv-guide |
| Djibouti                 | `dj` | https://www.dstv.com/en-dj/explore/tv-guide |
| Equatorial Guinea        | `gq` | https://www.dstv.com/en-gq/explore/tv-guide |
| Eritrea                  | `er` | https://www.dstv.com/en-er/explore/tv-guide |
| Eswatini                 | `sz` | https://www.dstv.com/en-sz/explore/tv-guide |
| Ethiopia                 | `et` | https://www.dstv.com/en-et/explore/tv-guide |
| Gabon                    | `ga` | https://www.dstv.com/en-ga/explore/tv-guide |
| Gambia                   | `gm` | https://www.dstv.com/en-gm/explore/tv-guide |
| Ghana                    | `gh` | https://www.dstv.com/en-gh/explore/tv-guide |
| Guinea                   | `gn` | https://www.dstv.com/en-gn/explore/tv-guide |
| Guinea-Bissau            | `gw` | https://www.dstv.com/en-gw/explore/tv-guide |
| Ivory Coast              | `ci` | https://www.dstv.com/en-ci/explore/tv-guide |
| Kenya                    | `ke` | https://www.dstv.com/en-ke/explore/tv-guide |
| Liberia                  | `lr` | https://www.dstv.com/en-lr/explore/tv-guide |
| Madagascar               | `mg` | https://www.dstv.com/en-mg/explore/tv-guide |
| Malawi                   | `mw` | https://www.dstv.com/en-mw/explore/tv-guide |
| Mali                     | `ml` | https://www.dstv.com/en-ml/explore/tv-guide |
| Mauritania               | `mr` | https://www.dstv.com/en-mr/explore/tv-guide |
| Mauritius                | `mu` | https://www.dstv.com/en-mu/explore/tv-guide |
| Mozambique               | `mz` | https://www.dstv.com/en-mz/explore/tv-guide |
| Namibia                  | `na` | https://www.dstv.com/en-na/explore/tv-guide |
| Niger                    | `ne` | https://www.dstv.com/en-ne/explore/tv-guide |
| Nigeria                  | `ng` | https://www.dstv.com/en-ng/explore/tv-guide |
| Republic of the Congo    | `cg` | https://www.dstv.com/en-cg/explore/tv-guide |
| Rwanda                   | `rw` | https://www.dstv.com/en-rw/explore/tv-guide |
| Sao Tome and Principe    | `st` | https://www.dstv.com/en-st/explore/tv-guide |
| Senegal                  | `sn` | https://www.dstv.com/en-sn/explore/tv-guide |
| Seychelles               | `sc` | https://www.dstv.com/en-sc/explore/tv-guide |
| Sierra Leone             | `sl` | https://www.dstv.com/en-sl/explore/tv-guide |
| Somalia                  | `so` | https://www.dstv.com/en-so/explore/tv-guide |
| South Africa             | `za` | https://www.dstv.com/en-za/explore/tv-guide |
| South Sudan              | `ss` | https://www.dstv.com/en-ss/explore/tv-guide |
| Sudan                    | `sd` | https://www.dstv.com/en-sd/explore/tv-guide |
| Tanzania                 | `tz` | https://www.dstv.com/en-tz/explore/tv-guide |
| Togo                     | `tg` | https://www.dstv.com/en-tg/explore/tv-guide |
| Uganda                   | `ug` | https://www.dstv.com/en-ug/explore/tv-guide |
| Zambia                   | `zm` | https://www.dstv.com/en-zm/explore/tv-guide |
| Zimbabwe                 | `zw` | https://www.dstv.com/en-zw/explore/tv-guide |

### Download the guide

```sh
npm run grab --- --channels=sites/dstv.com/dstv.com_<COUNTRY_CODE>.channels.xml
```

### Update channel list

```sh
npm run channels:parse --- --config=./sites/dstv.com/dstv.com.config.js --output=./sites/dstv.com/dstv.com_<COUNTRY_CODE>.channels.xml --set=country:<COUNTRY_CODE>
```

### Test

```sh
npm test --- dstv.com
```
