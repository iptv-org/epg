# pickx.be

https://www.pickx.be/fr/television/programme-tv

### Download the guide

Dutch:

```sh
npm run grab --- --site=pickx.be --lang=nl
```

English:

```sh
npm run grab --- --site=pickx.be --lang=en
```

French:

```sh
npm run grab --- --site=pickx.be --lang=fr
```

German:

```sh
npm run grab --- --site=pickx.be --lang=de
```

### Update channel list

Dutch:

```sh
npm run channels:parse --- --config=./sites/pickx.be/pickx.be.config.js --output=./sites/pickx.be/pickx.be_nl.channels.xml --set=lang:nl
```

English:

```sh
npm run channels:parse --- --config=./sites/pickx.be/pickx.be.config.js --output=./sites/pickx.be/pickx.be_en.channels.xml --set=lang:en
```

French:

```sh
npm run channels:parse --- --config=./sites/pickx.be/pickx.be.config.js --output=./sites/pickx.be/pickx.be_fr.channels.xml --set=lang:fr
```

German:

```sh
npm run channels:parse --- --config=./sites/pickx.be/pickx.be.config.js --output=./sites/pickx.be/pickx.be_de.channels.xml --set=lang:de
```

### Test

```sh
npm test --- pickx.be
```
