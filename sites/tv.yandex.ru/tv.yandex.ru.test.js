// npx epg-grabber --config=sites/tv.yandex.ru/tv.yandex.ru.config.js --channels=sites/tv.yandex.ru/tv.yandex.ru.channels.xml --output=guide.xml --days=2

const { parser, url, request } = require('./tv.yandex.ru.config.js')
const dayjs = require('dayjs')
const utc = require('dayjs/plugin/utc')
const customParseFormat = require('dayjs/plugin/customParseFormat')
dayjs.extend(customParseFormat)
dayjs.extend(utc)

const date = dayjs.utc('2021-11-25', 'YYYY-MM-DD').startOf('d')
const channel = {
  site_id: '162#31-kanal-429',
  xmltv_id: '31Kanal.kz'
}
const content = `<!DOCTYPE html><html lang="ru" class="device_not-touch device_not-svg"> <head></head> <body class="page page_controller_channel"> <script nonce="llVCGFBPYt0ZRILmUsvJAQ=="> window.__EXPERIMENTS__={};window.__INITIAL_STATE__ = {"channel":{"channel":{"title":"31 канал","familyTitle":"31 канал","transliteratedFamilyTitle":"31-kanal-429","logo":{"original":{"src":"//avatars.mds.yandex.net/get-tv-channel-logos/30303/2a00000170e2a3ef22bf7cfa4ff11e8405de/orig","original":true},"sizes":{"38":{"src":"//avatars.mds.yandex.net/get-tv-channel-logos/30303/2a00000170e2a3ef22bf7cfa4ff11e8405de/small"},"48":{"src":"//avatars.mds.yandex.net/get-tv-channel-logos/30303/2a00000170e2a3ef22bf7cfa4ff11e8405de/48x72"},"64":{"src":"//avatars.mds.yandex.net/get-tv-channel-logos/30303/2a00000170e2a3ef22bf7cfa4ff11e8405de/64x36"},"80":{"src":"//avatars.mds.yandex.net/get-tv-channel-logos/30303/2a00000170e2a3ef22bf7cfa4ff11e8405de/80x60"},"114":{"src":"//avatars.mds.yandex.net/get-tv-channel-logos/30303/2a00000170e2a3ef22bf7cfa4ff11e8405de/114x80"},"130":{"src":"//avatars.mds.yandex.net/get-tv-channel-logos/30303/2a00000170e2a3ef22bf7cfa4ff11e8405de/130x80"},"160":{"src":"//avatars.mds.yandex.net/get-tv-channel-logos/30303/2a00000170e2a3ef22bf7cfa4ff11e8405de/170x100"}},"originalSize":{"src":"//avatars.mds.yandex.net/get-tv-channel-logos/30303/2a00000170e2a3ef22bf7cfa4ff11e8405de/orig","original":true},"maxSize":{"src":"//avatars.mds.yandex.net/get-tv-channel-logos/30303/2a00000170e2a3ef22bf7cfa4ff11e8405de/170x100"}},"synonyms":[],"familyId":429,"id":129,"genres":[],"type":"regional","description":"31 канал - общенациональный казахстанский телеканал. Сетка вещания состоит из программных продуктов местного и зарубежного производства. Основной контент канала – развлекательные шоу, мультфильмы, художественные фильмы и сериалы. Также в эфире выпуски новостей, сообщающие о событиях в стране и мире. Вещание ведется на казахском и русском языках.","url":"/162/channel/31-kanal-429?date=2021-11-25","isFavorite":false,"hasBroadcasting":false,"broadcastingUrl":"","hasBroadcastingPlayer":false,"broadcastingPlayerUrl":""},"schedule":{"finish":"2021-11-29T05:00:00+06:00","hasFinished":false,"events":[{"id":187687780,"channelId":129,"channelFamilyId":429,"live":false,"episode":{"id":4191488,"description":"","title":"Ризамын (каз.)."},"program":{"trailers":[],"onlines":[],"id":4191488,"type":{"id":6,"name":"досуг","alias":"entertain","isFilm":false,"isSerial":false,"isForChildren":false},"title":"Ризамын (каз.).","transliteratedTitle":"rizamyn-kaz-4191488","description":"kLX6FVKAIiDCGBFE","favourite":false,"tags":[],"displayIfNoEvents":false,"duplicateIds":[4191488],"url":"/162/program/rizamyn-kaz-4191488","images":[]},"start":"2021-11-25T05:00:00+06:00","finish":"2021-11-25T05:58:00+06:00","yacFamilyId":0,"title":"Ризамын (каз.).","programTitle":"","episodeTitle":"Ризамын (каз.).","seasonTitle":"","url":"/162/program/rizamyn-kaz-4191488?eventId=187687780","hasDescription":false,"hasReminder":false,"hasReminderButton":false,"startTime":"05:00","hasStarted":true,"isNow":true,"hasFinished":true,"progress":100,"humanDate":"25 ноября, четверг, 05:00 — 05:58"}]},"recommendedAll":[]},"favoriteChannels":[],"recommendedAll":[],"reminders":{"items":[]},"wannaSee":{"items":[]}};window.__INITIAL_SK__={key: '429d0d0e3e22742c71eaa3cf71a440780c91cdd2:1637801857060', expire: 1637888257060}window.__INIT_APP__=true window.__USER_SESSION_ID__='d1451a74-4dd1-4bd6-9b19-18de14bc6dd0' window.__AAB__=true window.process={env:{YANDEX_ENV: 'production', IS_ADAPTIVE: false, IS_DEVELOP: false, IS_QA: false, IS_PRODUCTION: true}}</script> </body></html>`

it('can generate valid url', () => {
  expect(url({ channel, date })).toBe(
    'https://tv.yandex.ru/162/channel/31-kanal-429?date=2021-11-25'
  )
})

it('can generate valid request headers', () => {
  expect(request.headers).toMatchObject({
    Cookie:
      'yandexuid=8747786251615498142; Expires=Tue, 11 Mar 2031 21:29:02 GMT; Domain=yandex.ru; Path=/'
  })
})

it('can parse response', () => {
  const result = parser({ content }).map(p => {
    p.start = p.start.toJSON()
    p.stop = p.stop.toJSON()
    return p
  })

  expect(result).toMatchObject([
    {
      start: '2021-11-24T23:00:00.000Z',
      stop: '2021-11-24T23:58:00.000Z',
      title: `Ризамын (каз.).`,
      category: 'досуг',
      description: 'kLX6FVKAIiDCGBFE'
    }
  ])
})

it('can handle empty guide', () => {
  const result = parser({
    date,
    channel,
    content: `<!DOCTYPE html><html><head></head><body></body></html>`
  })
  expect(result).toMatchObject([])
})
