# tv.yandex.ru

https://tv.yandex.ru/

This site is protected by captcha, so if you hit by an error `Got captcha, please goto https://tv.yandex.ru and update cookies!`,
update site configuration in `tv.yandex.ru.config.js` by heading to this site and use browser
Developer Tools and replace matching cookies.

### Download the guide

```sh
npm run grab -- --site=tv.yandex.ru
```

### Update channel list

```sh
npm run channels:parse -- --config=sites/tv.yandex.ru/tv.yandex.ru.config.js --output=sites/tv.yandex.ru/tv.yandex.ru.channels.xml
```

### Test

```sh
npm test -- tv.yandex.ru
```
