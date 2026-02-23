# watch.whaletvplus.com

https://watch.whaletvplus.com

### Download the guide

```sh
npm run grab --- --site=watch.whaletvplus.com
```

### Update channel list

```sh
npm run channels:parse --- --config=./sites/watch.whaletvplus.com/watch.whaletvplus.com.config.js --output=./sites/watch.whaletvplus.com/watch.whaletvplus.com.channels.xml
```

### Test

```sh
npm test --- watch.whaletvplus.com
```

### Fix `apiToken invalid or expired. Please update config.`

The `apiToken` rarely changes, but if it does:
1. Go to https://watch.whaletvplus.com
2. Open Developer Tools (press `F12` or right-click and select **Inspect**).
3. Select the **Network** tab.
4. Refresh the page.
5. In the "Filter" box, type `apiToken`.
6. Click on any request found and copy the `apiToken` value from the request URL.