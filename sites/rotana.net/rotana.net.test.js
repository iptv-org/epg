// npx epg-grabber --config=sites/rotana.net/rotana.net.config.js --channels=sites/rotana.net/rotana.net.channels.xml --output=guide.xml --days=2

const { parser, url, request } = require('./rotana.net.config.js')
const dayjs = require('dayjs')
const utc = require('dayjs/plugin/utc')
const customParseFormat = require('dayjs/plugin/customParseFormat')
dayjs.extend(customParseFormat)
dayjs.extend(utc)

const date = dayjs.utc('2021-11-08', 'YYYY-MM-DD').startOf('d')
const channel = {
  site_id: 'KHALIJIA-7',
  xmltv_id: 'RotanaKhalejia.sa'
}
const buffer =
  Buffer.from(`Event ID,Event Name,Arabic Event Name,Start Date,Start Time,End Date,End Time,Short Description,Arabic Short Description,Extended Description,Arabic Extended Description,,Genre,Audio,Video
,حسب الظروف,حسب الظروف بدون تترات - Episode 16,07/11/2021,23:30:00:00,08/11/2021,00:00:00:00,,,,,,Drama,,
,كورة,كورة,08/11/2021,01:30:00:00,08/11/2021,03:00:00:00,,,,,,Generic,,`)

it('can generate valid url', () => {
  const result = url({ channel, date })
  expect(result).toBe('https://rotana.net/triAssets/uploads/2020/11/KHALIJIA-7.csv')
})

it('can parse response', done => {
  parser({ date, channel, buffer })
    .then(result => {
      expect(result).toMatchObject([
        {
          start: '2021-11-08T01:30:00.000Z',
          stop: '2021-11-08T03:00:00.000Z',
          title: 'كورة',
          category: 'Generic',
          description: ``
        }
      ])
      done()
    })
    .catch(() => {
      done()
    })
})

it('can handle empty guide', done => {
  parser({
    date,
    channel,
    buffer: Buffer.from(`<!DOCTYPE html><html><head></head><body></body></html>`)
  })
    .then(result => {
      expect(result).toMatchObject([])
      done()
    })
    .catch(() => {
      done()
    })
})
