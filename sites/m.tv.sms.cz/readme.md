# m.tv.sms.cz

https://m.tv.sms.cz/

### Download the guide

Windows (Command Prompt):

```sh
SET "NODE_OPTIONS=--tls-cipher-list=DEFAULT@SECLEVEL=0" && npm run grab --- --site=m.tv.sms.cz
```

Windows (PowerShell):

```sh
$env:NODE_OPTIONS="--tls-cipher-list=DEFAULT@SECLEVEL=0"; npm run grab --- --site=m.tv.sms.cz
```

Linux and macOS:

```sh
NODE_OPTIONS='--tls-cipher-list=DEFAULT@SECLEVEL=0' npm run grab --- --site=m.tv.sms.cz
```

### Update channel list

Windows (Command Prompt):

```sh
SET "NODE_OPTIONS=--tls-cipher-list=DEFAULT@SECLEVEL=0" && npm run channels:parse --- --config=./sites/m.tv.sms.cz/m.tv.sms.cz.config.js --output=./sites/m.tv.sms.cz/m.tv.sms.cz.channels.xml
```

Windows (PowerShell):

```sh
$env:NODE_OPTIONS="--tls-cipher-list=DEFAULT@SECLEVEL=0"; npm run channels:parse --- --config=./sites/m.tv.sms.cz/m.tv.sms.cz.config.js --output=./sites/m.tv.sms.cz/m.tv.sms.cz.channels.xml
```

Linux and macOS:

```sh
NODE_OPTIONS='--tls-cipher-list=DEFAULT@SECLEVEL=0' npm run channels:parse --- --config=./sites/m.tv.sms.cz/m.tv.sms.cz.config.js --output=./sites/m.tv.sms.cz/m.tv.sms.cz.channels.xml
```

### Test

```sh
npm test --- m.tv.sms.cz
```
