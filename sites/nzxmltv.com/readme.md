# nzxmltv.com

https://nzxmltv.com/

### Download the guide

Freeview:

```sh
npm run grab --- --channels=sites/nzxmltv.com/nzxmltv.com_freeview.channels.xml
```

Sky:

```sh
npm run grab --- --channels=sites/nzxmltv.com/nzxmltv.com_sky.channels.xml
```

Red Bull TV:

```sh
npm run grab --- --channels=sites/nzxmltv.com/nzxmltv.com_redbull.channels.xml
```

Pluto TV:

```sh
npm run grab --- --channels=sites/nzxmltv.com/nzxmltv.com_pluto.channels.xml
```

### Update channel list

Freeview:

```sh
npm run channels:parse --- --config=./sites/nzxmltv.com/nzxmltv.com.config.js --output=./sites/nzxmltv.com/nzxmltv.com_freeview.channels.xml --set=provider:freeview
```

Sky:

```sh
npm run channels:parse --- --config=./sites/nzxmltv.com/nzxmltv.com.config.js --output=./sites/nzxmltv.com/nzxmltv.com_sky.channels.xml --set=provider:sky
```

Red Bull TV:

```sh
npm run channels:parse --- --config=./sites/nzxmltv.com/nzxmltv.com.config.js --output=./sites/nzxmltv.com/nzxmltv.com_redbull.channels.xml --set=provider:redbull
```

Pluto TV:

```sh
npm run channels:parse --- --config=./sites/nzxmltv.com/nzxmltv.com.config.js --output=./sites/nzxmltv.com/nzxmltv.com_pluto.channels.xml --set=provider:pluto
```

### Test

```sh
npm test --- nzxmltv.com
```
