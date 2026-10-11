# sky.com

https://www.sky.com/tv-guide

All Sky countries are covered: Germany, Austria and Switzerland (`DE`), the United Kingdom and Ireland (`GB`), and Italy (`IT`).

Channel IDs use the format `<territory>#<sid>` (`GB#...`, `IT#...` or `DE#...`).

### Download the guide

```sh
npm run grab --- --sites=sky.com
```

### Update channel list

```sh
npm run channels:parse --- --config=./sites/sky.com/sky.com.config.js --output=./sites/sky.com/sky.com.channels.xml
```

### Test

```sh
npm test --- sky.com
```
