// npx epg-grabber --config=sites/tvim.tv/tvim.tv.config.js --channels=sites/tvim.tv/tvim.tv.channels.xml --days=2 --output=guide.xml

const { parser, url } = require('./tvim.tv.config.js')
const dayjs = require('dayjs')
const utc = require('dayjs/plugin/utc')
const customParseFormat = require('dayjs/plugin/customParseFormat')
dayjs.extend(customParseFormat)
dayjs.extend(utc)

const date = dayjs.utc('2021-10-24', 'YYYY-MM-DD').startOf('d')
const channel = { site_id: 'T7', xmltv_id: 'T7.rs' }
const content = `{"response":"ok","data":{"thumb":"https://mobile-api.tvim.tv/images/chan_logos/70x25/T7.png","thumb_rel":"https://mobile-api.tvim.tv/images/chan_logos/70x25/T7.png","thumb_large_rel":"https://mobile-api.tvim.tv/images/chan_logos/120x60/T7.png","thumb_http":"http://mobile-api.tvim.tv/images/chan_logos/70x25/T7.png","thumb_large":"http://mobile-api.tvim.tv/images/chan_logos/120x60/T7.png","server_time":1635100951,"catchup_length":2,"_id":"T73","ind":2,"genre":"national","name":"T7","epg_id":"T7","chan":"T7","prog":[{"id":"T7-1635026400","title":"Programi i T7","from":1635026400,"end":1635040800,"starting":"00:00","from_utc":1635026400,"end_utc":1635040800,"desc":"Programi i T7","genre":"test","chan":"T7","epg_id":"T7","eng":""}]}}`

it('can generate valid url', () => {
  const result = url({ date, channel })
  expect(result).toBe(
    'https://www.tvim.tv/script/program_epg?date=24.10.2021&prog=T7&server_time=true'
  )
})

it('can parse response', () => {
  const result = parser({ date, channel, content })
  expect(result).toMatchObject([
    {
      start: 'Sat, 23 Oct 2021 22:00:00 GMT',
      stop: 'Sun, 24 Oct 2021 02:00:00 GMT',
      title: 'Programi i T7',
      description: `Programi i T7`,
      category: 'test'
    }
  ])
})

it('can handle empty guide', () => {
  const result = parser({
    date,
    channel,
    content: `{"response":"ok","data":{"server_time":1635100927}}`
  })
  expect(result).toMatchObject([])
})
