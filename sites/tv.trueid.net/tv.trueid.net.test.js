// NODE_OPTIONS=--insecure-http-parser npx epg-grabber --config=sites/tv.trueid.net/tv.trueid.net.config.js --channels=sites/tv.trueid.net/tv.trueid.net.channels.xml --output=guide.xml --timeout=30000 --days=2

const { parser, url } = require('./tv.trueid.net.config.js')
const dayjs = require('dayjs')
const utc = require('dayjs/plugin/utc')
const customParseFormat = require('dayjs/plugin/customParseFormat')
dayjs.extend(customParseFormat)
dayjs.extend(utc)

const date = dayjs.utc('2021-10-28', 'YYYY-MM-DD').startOf('d')
const channel = {
  site_id: 'tv-nfl-nba',
  xmltv_id: 'NFLNBATV.us',
  name: 'NFL &amp; NBA TV'
}
const content = `<!DOCTYPE html><html lang="th"><head></head><body><script id="__NEXT_DATA__" type="application/json">{"props":{"pageProps":{"lang":"th","listEPG":{"status":200,"data":[{"cmsId":"eXlvvZ4EA5aY","channelCode":"t513","logo":"https://cms.dmpcdn.com/livetv/2021/09/28/2c9c41c0-203b-11ec-9346-6f50de6452df_webp_original.png","title":"NFL \\u0026 NBA TV","slug":"tv-nfl-nba","url":"https://tv.trueid.net/live/tv-nfl-nba","programList":[{"title_id":"710569","title":"NBA 2021/22","displayTime":"02:00 - 04:00","time":120,"channel_code":"t513","detail":{"title_id":"710569","title":"NBA 2021/22","display_date":"Fri","start_date":"2021-10-28T19:00:00.000Z","end_date":"2021-10-28T21:00:00.000Z","thumb":"https://epgthumb.dmpcdn.com/thumbnail_large/t513/20211029/20211029_020000.jpg","ep_no":"43","ep_name":"043:MIAMI VS BROOKLYN 28 OCT"},"no":3,"status":true}]}]},"category_name":"all","nowDate":"2021-10-29","metaTitle":"ผังรายการทีวีช่องทีวีทั้งหมด วันที่ 29/10/2021"},"lang":"th","currentUrl":"https://tv.trueid.net/tvguide/all\\u0026is_gcp=false"}}</script></body></html>`

it('can generate valid url', () => {
  const result = url({ channel, date })
  expect(result).toBe('https://tv.trueid.net/tvguide/all/tv-nfl-nba/2021-10-28')
})

it('can parse response', () => {
  const result = parser({ date, channel, content }).map(p => {
    p.start = p.start.toJSON()
    p.stop = p.stop.toJSON()
    return p
  })
  expect(result).toMatchObject([
    {
      start: '2021-10-28T19:00:00.000Z',
      stop: '2021-10-28T21:00:00.000Z',
      title: 'NBA 2021/22',
      icon: 'https://epgthumb.dmpcdn.com/thumbnail_large/t513/20211029/20211029_020000.jpg'
    }
  ])
})

it('can handle empty guide', () => {
  const result = parser({ date, channel, content: `{}` })
  expect(result).toMatchObject([])
})
