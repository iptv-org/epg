// npx epg-grabber --config=sites/tv.nu/tv.nu.config.js --channels=sites/tv.nu/tv.nu.channels.xml --output=guide.xml --days=2

const { parser, url } = require('./tv.nu.config.js')
const dayjs = require('dayjs')
const utc = require('dayjs/plugin/utc')
const customParseFormat = require('dayjs/plugin/customParseFormat')
dayjs.extend(customParseFormat)
dayjs.extend(utc)

const date = dayjs.utc('2022-03-06', 'YYYY-MM-DD').startOf('d')
const channel = {
  site_id: '3sat',
  xmltv_id: '3sat.de'
}

it('can generate valid url', () => {
  expect(url({ channel, date })).toBe(
    'https://web-api.tv.nu/channels/3sat/schedule?date=2022-03-06&fullDay=true'
  )
})

it('can parse response', () => {
  const content = `{"meta":{"status":200},"data":{"id":30139,"name":"RTL","slug":"rtl","themedLogo":{"light":{"url":"https://new.static.tv.nu/19402170","isFallback":false},"dark":{"url":"https://new.static.tv.nu/59995595","isFallback":true}},"broadcasts":[{"type":"broadcast","id":"1OoSZY-7Q7-1DzQ","slug":"csi","programId":"2452","isPlay":true,"isMovie":false,"isSeries":true,"isLive":false,"title":"CSI: Den Tätern auf der Spur","description":"Hellseherin Sedona Wiley wird tot aufgefunden. Die Ermittlungen führen zu einem alten Mord. Gordon Wallace wurde vor 15 Jahren beschuldigt, seine Frau getötet zu haben, jedoch wurde nie eine Leiche gefunden.","imagePortrait":"https://new.static.tv.nu/16686512","imageLandscape":"https://new.static.tv.nu/13119997","year":2006,"genres":["Action","Kriminaldrama","Mysterium","Spänning","Thriller"],"imdb":{"rating":"7.7","link":"https://www.imdb.com/title/tt0247082"},"playProviders":[{"name":"Viaplay","slug":"viaplay","themedLogo":{"light":{"url":"https://new.static.tv.nu/17048879","isFallback":false},"dark":{"url":"https://new.static.tv.nu/119659437","isFallback":false}},"url":"https://viaplay.se/serier/csi-crime-scene-investigation/sasong-6/avsnitt-19?utm_source=tv.nu&utm_content=CSI%3A+Crime+Scene+Investigation"},{"name":"Tele2 Play","slug":"tele2play","themedLogo":{"light":{"url":"https://new.static.tv.nu/158747195","isFallback":false},"dark":{"url":"https://new.static.tv.nu/158747194","isFallback":false}},"url":"https://www.comhemplay.se/open/vod/SH016259780000?utm_source=tv.nu&utm_medium=partner&utm_campaign=tabla&utm_content=CSI%3A+Crime+Scene+Investigation"},{"name":"Prime Video","slug":"prime-video","themedLogo":{"light":{"url":"https://new.static.tv.nu/23085972","isFallback":false},"dark":{"url":"https://new.static.tv.nu/275111","isFallback":true}},"url":"https://app.primevideo.com/detail?gti=amzn1.dv.gti.54af67f9-e58f-e6db-4991-81eb4f2efa37&utm_source=tv.nu"}],"broadcast":{"id":"1OoSZY-7Q7-1DzQ","startTime":1660878900000,"endTime":1660881600000,"channel":{"name":"RTL","slug":"rtl","themedLogo":{"light":{"url":"https://new.static.tv.nu/19402170","isFallback":false},"dark":{"url":"https://new.static.tv.nu/59995595","isFallback":true}}}},"totalEpisodes":24,"episodeNumber":19,"seasonNumber":6}]}}`
  const result = parser({ content }).map(p => {
    p.start = p.start.toJSON()
    p.stop = p.stop.toJSON()
    return p
  })

  expect(result).toMatchObject([
    {
      start: '2022-08-19T03:15:00.000Z',
      stop: '2022-08-19T04:00:00.000Z',
      title: 'CSI: Den Tätern auf der Spur',
      description:
        'Hellseherin Sedona Wiley wird tot aufgefunden. Die Ermittlungen führen zu einem alten Mord. Gordon Wallace wurde vor 15 Jahren beschuldigt, seine Frau getötet zu haben, jedoch wurde nie eine Leiche gefunden.',
      icon: 'https://new.static.tv.nu/13119997',
      category: ['Action', 'Kriminaldrama', 'Mysterium', 'Spänning', 'Thriller'],
      season: 6,
      episode: 19
    }
  ])
})

it('can handle empty guide', () => {
  const result = parser({
    content: `{"meta":{"status":200},"data":{"broadcasts":[]}}`
  })
  expect(result).toMatchObject([])
})
