# beinsports.com

https://www.beinsports.com/en-au/tv-guide (Australia)

https://www.beinsports.com/fr-fr/tv-guide (France)

https://www.beinsports.com/ar-mena/%D8%AC%D8%AF%D9%88%D9%84-%D8%A7%D9%84%D8%A8%D8%AB (MENA - Arabic)

https://www.beinsports.com/en-mena/tv-guide (MENA - English)

https://www.beinsports.com/en-my/tv-guide (Malaysia)

https://www.beinsports.com/en-nz/tv-guide (New Zealand)

https://www.beinsports.com/en-us/tv-guide (US - English)

https://www.beinsports.com/es-us/tv-guide (US - Spanish)

### Download the guide

Australia:

```sh
npm run grab -- --channels=sites/beinsports.com/beinsports.com_au-en.channels.xml
```

France:

```sh
npm run grab -- --channels=sites/beinsports.com/beinsports.com_fr-fr.channels.xml
```

MENA (Arabic):

```sh
npm run grab -- --channels=sites/beinsports.com/beinsports.com_mena-ar.channels.xml
```

MENA (English):

```sh
npm run grab -- --channels=sites/beinsports.com/beinsports.com_mena-en.channels.xml
```

Malaysia:

```sh
npm run grab -- --channels=sites/beinsports.com/beinsports.com_my-en.channels.xml
```

New Zealand:

```sh
npm run grab -- --channels=sites/beinsports.com/beinsports.com_nz-en.channels.xml
```

US (English):

```sh
npm run grab -- --channels=sites/beinsports.com/beinsports.com_us-en.channels.xml
```

US (Spanish):

```sh
npm run grab -- --channels=sites/beinsports.com/beinsports.com_us-es.channels.xml
```

### Update channel list

Australia:

```sh
npm run channels:parse -- --config=./sites/beinsports.com/beinsports.com.config.js --output=./sites/beinsports.com/beinsports.com_au-en.channels.xml --set=region:au --set=lang:en
```

France:

```sh
npm run channels:parse -- --config=./sites/beinsports.com/beinsports.com.config.js --output=./sites/beinsports.com/beinsports.com_fr-fr.channels.xml --set=region:fr --set=lang:fr
```

MENA (Arabic):

```sh
npm run channels:parse -- --config=./sites/beinsports.com/beinsports.com.config.js --output=./sites/beinsports.com/beinsports.com_mena-ar.channels.xml --set=region:mena --set=lang:ar
```

MENA (English):

```sh
npm run channels:parse -- --config=./sites/beinsports.com/beinsports.com.config.js --output=./sites/beinsports.com/beinsports.com_mena-en.channels.xml --set=region:mena --set=lang:en
```

Malaysia:

```sh
npm run channels:parse -- --config=./sites/beinsports.com/beinsports.com.config.js --output=./sites/beinsports.com/beinsports.com_my-en.channels.xml --set=region:my --set=lang:en
```

New Zealand:

```sh
npm run channels:parse -- --config=./sites/beinsports.com/beinsports.com.config.js --output=./sites/beinsports.com/beinsports.com_nz-en.channels.xml --set=region:nz --set=lang:en
```

US (English):

```sh
npm run channels:parse -- --config=./sites/beinsports.com/beinsports.com.config.js --output=./sites/beinsports.com/beinsports.com_us-en.channels.xml --set=region:us --set=lang:en
```

US (Spanish):

```sh
npm run channels:parse -- --config=./sites/beinsports.com/beinsports.com.config.js --output=./sites/beinsports.com/beinsports.com_us-es.channels.xml --set=region:us --set=lang:es
```

### Test

```sh
npm test -- beinsports.com
```
