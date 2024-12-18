# indihometv.com

https://www.indihometv.com/

### Download the guide

```sh
npm run grab --- --site=indihometv.com
```

**NOTE:** Requests from some regions may return a "Connection timeout" error (https://check-host.net/check-report/13a843e2ke22).

### Update channel list

```sh
npm run channels:parse --- --config=./sites/indihometv.com/indihometv.com.config.js --output=./sites/indihometv.com/indihometv.com.channels.xml
```

### Test

```sh
npm test --- indihometv.com
```
