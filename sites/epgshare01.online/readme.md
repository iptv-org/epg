# epgshare01.online

https://epgshare01.online/epgshare01/

| Tag                 |
| ------------------- |
| `ALJAZEERA1`        |
| `AR1`               |
| `ASIANTELEVISION1`  |
| `AU1`               |
| `BA1`               |
| `BE2`               |
| `BEIN1`             |
| `BG1`               |
| `BR1`               |
| `CA1`               |
| `CH1`               |
| `CL1`               |
| `CO1`               |
| `CR1`               |
| `CY1`               |
| `CZ1`               |
| `DE1`               |
| `DELUXEMUSIC1`      |
| `DIRECTVSPORTS1`    |
| `DISTROTV1`         |
| `DK1`               |
| `DO1`               |
| `DRAFTKINGS1`       |
| `DUMMY_CHANNELS`    |
| `EC1`               |
| `EG1`               |
| `ES1`               |
| `EUROSPORT1`        |
| `FANDUEL1`          |
| `FI1`               |
| `FR1`               |
| `GR1`               |
| `HK1`               |
| `HR1`               |
| `HU1`               |
| `ID1`               |
| `IE1`               |
| `IL1`               |
| `IN4`               |
| `IT1`               |
| `JM1`               |
| `JP1`               |
| `JP2`               |
| `KE1`               |
| `KR1`               |
| `MT1`               |
| `MX1`               |
| `MY1`               |
| `NAUTICAL_CHANNEL1` |
| `NG1`               |
| `NL1`               |
| `NO1`               |
| `NZ1`               |
| `OPTUSSPORTS1`      |
| `PA1`               |
| `PAC-12`            |
| `PE1`               |
| `PH1`               |
| `PH2`               |
| `PK1`               |
| `PL1`               |
| `PLEX1`             |
| `POWERNATION1`      |
| `PT1`               |
| `RAKUTEN_DE1`       |
| `RAKUTEN_EN1`       |
| `RAKUTEN_ES1`       |
| `RAKUTEN_FR1`       |
| `RAKUTEN_IT1`       |
| `RAKUTEN_NL1`       |
| `RAKUTEN_PL1`       |
| `RALLY_TV1`         |
| `RO1`               |
| `RO2`               |
| `SA1`               |
| `SA2`               |
| `SAMSUNG1`          |
| `SE1`               |
| `SG1`               |
| `SK1`               |
| `SPORTKLUB1`        |
| `SSPORTPLUS1`       |
| `SV1`               |
| `TBNPLUS1`          |
| `TENNIS1`           |
| `THESPORTPLUS1`     |
| `TR1`               |
| `TR3`               |
| `UK1`               |
| `US1`               |
| `US_LOCALS2`        |
| `US_SPORTS1`        |
| `UY1`               |
| `VN1`               |
| `VOA1`              |
| `ZA1`               |
| `viva-russia.ru`    |

### Download the guide

Windows (Command Prompt):

```sh
SET "NODE_OPTIONS=--max-old-space-size=6000" && npm run grab --- --channels=sites/epgshare01.online/epgshare01.online_<TAG>.channels.xml
```

Windows (PowerShell):

```sh
$env:NODE_OPTIONS="--max-old-space-size=6000"; npm run grab --- --channels=sites/epgshare01.online/epgshare01.online_<TAG>.channels.xml
```

Linux and macOS:

```sh
NODE_OPTIONS=--max-old-space-size=6000 npm run grab --- --channels=sites/epgshare01.online/epgshare01.online_<TAG>.channels.xml
```

### Update channel list

```sh
npm run channels:parse --- --config=./sites/epgshare01.online/epgshare01.online.config.js --output=./sites/epgshare01.online/epgshare01.online_<TAG>.channels.xml --set=tag:<TAG>
```

### Test

```sh
npm test --- epgshare01.online
```
