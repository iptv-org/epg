# s.mxtv.jp

<https://s.mxtv.jp>

## Index

- [Index](#index)
- [Download the guide](#download-the-guide)
- [Update channel list](#update-channel-list)
- [Test](#test)

## Download the guide

```sh
npm run grab --- --site=s.mxtv.jp
```

## Update channel list

```sh
npm run channels:parse --- --config=./sites/s.mxtv.jp/s.mxtv.jp.config.js --output=./sites/s.mxtv.jp/s.mxtv.jp.channels.xml
```

## Test

```sh
npm test --- s.mxtv.jp
```
