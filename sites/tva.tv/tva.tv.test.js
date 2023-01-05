// node ./scripts/channels.js --config=./sites/tva.tv/tva.tv.config.js --output=./sites/tva.tv/tva.tv.channels.xml
// npx epg-grabber --config=sites/tva.tv/tva.tv.config.js --channels=sites/tva.tv/tva.tv.channels.xml --output=guide.xml --timeout=30000 --days=2

const { parser, url } = require('./tva.tv.config.js')
const dayjs = require('dayjs')
const utc = require('dayjs/plugin/utc')
const customParseFormat = require('dayjs/plugin/customParseFormat')
dayjs.extend(customParseFormat)
dayjs.extend(utc)

const date = dayjs.utc('2021-11-25', 'YYYY-MM-DD').startOf('d')
const channel = {
  site_id: '6fcc0a2e-1135-482c-b054-08a96e68b758',
  xmltv_id: 'IRIB2.ir'
}
const content = `{"data":[{"id":"c0667229-eaf8-472f-8ba7-ad4417348baf","start_at":"2021-11-24T00:20:39.000Z","end_at":"2021-11-24T00:32:11.000Z","description":"تلفن های شبکه 5 سیما:   تلفن: 23511000 -تلفن گویا:2786500 نمابر:23511289","name":"میان برنامه","subtitle":"","season_number":null,"episode_number":null,"channel_id":"6fcc0a2e-1135-482c-b054-08a96e68b758","program_id":"e495c06e-80de-46ee-9120-619631f554d9","competition_id":null,"object":"program_event","cast_members":[],"genres":[],"images":[],"program_type":null,"certification_ratings":[]}]}`

it('can generate valid url', () => {
  expect(url({ channel, date })).toBe(
    'https://api.ott.tva.tv/v2/epg/program_events.json?channel_id=6fcc0a2e-1135-482c-b054-08a96e68b758&pivot_date=2021-11-25'
  )
})

it('can parse response', () => {
  const result = parser({ content, channel, date }).map(p => {
    p.start = p.start.toJSON()
    p.stop = p.stop.toJSON()
    return p
  })

  expect(result).toMatchObject([
    {
      start: '2021-11-24T00:20:39.000Z',
      stop: '2021-11-24T00:32:11.000Z',
      title: `میان برنامه`,
      description: 'تلفن های شبکه 5 سیما:   تلفن: 23511000 -تلفن گویا:2786500 نمابر:23511289'
    }
  ])
})

it('can handle empty guide', () => {
  const result = parser({
    date,
    channel,
    content: `{"errors":[{"id":"ebbebfb7-ffb0-4e0b-bcfb-1d9cd3e6c03c","code":"not_found","links":{"about":{"href":"https://app.bugsnag.com/jeytv/API/errors?filters[event.since][]=30d&filters[user.name][]=ebbebfb7-ffb0-4e0b-bcfb-1d9cd3e6c03c"}},"title":"Requested resource was not found","fallback_message":null,"object":"error"}],"meta":{"status":404}}`
  })
  expect(result).toMatchObject([])
})
