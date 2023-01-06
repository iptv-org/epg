// npx epg-grabber --config=sites/pbsguam.org/pbsguam.org.config.js --channels=sites/pbsguam.org/pbsguam.org.channels.xml --output=guide.xml --days=2

const { parser, url } = require('./pbsguam.org.config.js')
const dayjs = require('dayjs')
const utc = require('dayjs/plugin/utc')
const customParseFormat = require('dayjs/plugin/customParseFormat')
dayjs.extend(customParseFormat)
dayjs.extend(utc)

const date = dayjs.utc('2021-11-25', 'YYYY-MM-DD').startOf('d')
const channel = {
  site_id: '#',
  xmltv_id: 'KGTF.us'
}

it('can generate valid url', () => {
  expect(url).toBe('https://pbsguam.org/calendar/')
})

it('can parse response', () => {
  const content = `<!DOCTYPE html><html lang="en-US"> <head></head> <body> <script type='text/javascript' id='wcs-main-js-extra'>
/* <![CDATA[ */
var EventsSchedule_1 = {\"feed\":[{\"title\":\"Xavier Riddle and the Secret Museum\",\"id\":5097,\"thumbnail\":false,\"thumbnail_size\":false,\"multiday\":false,\"ending\":\"\",\"duration\":\"30'\",\"terms\":[],\"period\":30,\"excerpt\":\"\",\"hash\":\"5d7710f569fec3fb1839bd7e5ad87038\",\"visible\":true,\"timestamp\":1637829000,\"last\":false,\"start\":\"2021-11-25T08:30:00+00:00\",\"end\":\"2021-11-25T09:00:00+00:00\",\"future\":true,\"finished\":false,\"permalink\":\"https:\\/\\/pbsguam.org\\/class\\/xavier-riddle-and-the-secret-museum\\/?wcs_timestamp=1637829000\",\"buttons\":[],\"meta\":[]},{\"title\":\"Austin City Limits\",\"id\":3916,\"thumbnail\":false,\"thumbnail_size\":false,\"multiday\":false,\"ending\":\"\",\"duration\":\"1h\",\"terms\":[],\"period\":60,\"excerpt\":\"\",\"hash\":\"1255a0a23db3b726b38a5384147ec677\",\"visible\":true,\"timestamp\":1638140400,\"last\":false,\"start\":\"2021-11-28T23:00:00+00:00\",\"end\":\"2021-11-29T00:00:00+00:00\",\"future\":true,\"finished\":false,\"permalink\":\"https:\\/\\/pbsguam.org\\/class\\/austin-city-limits\\/?wcs_timestamp=1638140400\",\"buttons\":[],\"meta\":[]}]};
/* ]]> */
</script> </body></html>`
  const result = parser({ date, content }).map(p => {
    p.start = p.start.toJSON()
    p.stop = p.stop.toJSON()
    return p
  })

  expect(result).toMatchObject([
    {
      start: '2021-11-25T08:30:00.000Z',
      stop: '2021-11-25T09:00:00.000Z',
      title: 'Xavier Riddle and the Secret Museum'
    }
  ])
})

it('can handle empty guide', () => {
  const result = parser({
    date,
    channel,
    content: `<html> <head></head> <body></body></html>`
  })
  expect(result).toMatchObject([])
})
