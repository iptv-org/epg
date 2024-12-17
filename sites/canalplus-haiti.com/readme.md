# canalplus-haiti.com

https://www.canalplus-haiti.com/guide-tv-maintenant

### Download the guide

```sh
npm run grab --- --site=canalplus-haiti.com
```

### Update channel list

```sh
npm run channels:parse --- --config=./sites/canalplus-haiti.com/canalplus-haiti.com.config.js --output=./sites/canalplus-haiti.com/canalplus-haiti.com.channels.xml
```

### Test

```sh
npm test --- canalplus-haiti.com
```
