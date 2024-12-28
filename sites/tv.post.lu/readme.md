# tv.post.lu

https://tv.post.lu/en/tv-programme/

### Download the guide

```sh
npm run grab --- --site=tv.post.lu
```

### Update channel list

```sh
npm run channels:parse --- --config=./sites/tv.post.lu/tv.post.lu.config.js --output=./sites/tv.post.lu/tv.post.lu.channels.xml
```

### Test

```sh
npm test --- tv.post.lu
```
