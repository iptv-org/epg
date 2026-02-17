# tv.mail.ru

https://tv.mail.ru/

### Download the guide

```sh
npm run grab --- --site=tv.mail.ru
```

### Update channel list

```sh
npm run channels:parse --- --config=./sites/tv.mail.ru/tv.mail.ru.config.js --output=./sites/tv.mail.ru/tv.mail.ru.channels.xml
```

**NOTE:** There is a limit to the number of requests.

### Test

```sh
npm test --- tv.mail.ru
```
