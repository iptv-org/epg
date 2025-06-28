# ontvtonight.com

https://www.ontvtonight.com/au/guide/ (Australia)

https://www.ontvtonight.com/ca/guide/ (Canada)

https://www.ontvtonight.com/guide/ (US)

### Download the guide

Australia:

```sh
npm run grab --- --channels=sites/ontvtonight.com/ontvtonight.com_au.channels.xml
```

Canada:

```sh
npm run grab --- --channels=sites/ontvtonight.com/ontvtonight.com_ca.channels.xml
```

US:

```sh
npm run grab --- --channels=sites/ontvtonight.com/ontvtonight.com_us.channels.xml
```

### Update channel list

Australia:

```sh
npm run channels:parse --- --config=./sites/ontvtonight.com/ontvtonight.com.config.js --output=./sites/ontvtonight.com/ontvtonight.com_au.channels.xml --set=country:au
```

Canada:

```sh
npm run channels:parse --- --config=./sites/ontvtonight.com/ontvtonight.com.config.js --output=./sites/ontvtonight.com/ontvtonight.com_ca.channels.xml --set=country:ca
```

US:

```sh
npm run channels:parse --- --config=./sites/ontvtonight.com/ontvtonight.com.config.js --output=./sites/ontvtonight.com/ontvtonight.com_us.channels.xml --set=country:us
```

### Test

```sh
npm test --- ontvtonight.com
```
