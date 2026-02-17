# beinsports.com

|                | Region | Language | URL                                                                                  |
| -------------- | ------ | -------- | ------------------------------------------------------------------------------------ |
| Australia      | `au`   | `en`     | https://www.beinsports.com/en-au/tv-guide                                            |
| France         | `fr`   | `fr`     | https://www.beinsports.com/fr-fr/tv-guide                                            |
| MENA (Arabic)  | `mena` | `ar`     | https://www.beinsports.com/ar-mena/%D8%AC%D8%AF%D9%88%D9%84-%D8%A7%D9%84%D8%A8%D8%AB |
| MENA (English) | `mena` | `en`     | https://www.beinsports.com/en-mena/tv-guide                                          |
| Malaysia       | `my`   | `en`     | https://www.beinsports.com/en-my/tv-guide                                            |
| New Zealand    | `nz`   | `en`     | https://www.beinsports.com/en-nz/tv-guide                                            |
| US (English)   | `us`   | `en`     | https://www.beinsports.com/en-us/tv-guide                                            |
| US (Spanish)   | `us`   | `es`     | https://www.beinsports.com/es-us/tv-guide                                            |

### Download the guide

```sh
npm run grab --- --channels=sites/beinsports.com/beinsports.com_<REGION_CODE>-<LANGUAGE_CODE>.channels.xml
```

### Update channel list

```sh
npm run channels:parse --- --config=./sites/beinsports.com/beinsports.com.config.js --output=./sites/beinsports.com/beinsports.com_<REGION_CODE>-<LANGUAGE_CODE>.channels.xml --set=region:<REGION_CODE> --set=lang:<LANGUAGE_CODE>
```

### Test

```sh
npm test --- beinsports.com
```
