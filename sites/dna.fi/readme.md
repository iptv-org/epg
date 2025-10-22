# dna.fi

https://www.dna.fi/viihde/dna-viihde/tvopas

### Download the guide

```sh
npm run grab --- --site=dna.fi
```

### Update channel list

```sh
npm run channels:parse --- --config=./sites/dna.fi/dna.fi.config.js --output=./sites/dna.fi/dna.fi.channels.xml
```

### Test

```sh
npm test --- dna.fi
```
