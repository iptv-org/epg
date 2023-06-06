// npx epg-grabber --config=sites/turksatkablo.com.tr/turksatkablo.com.tr.config.js --channels=sites/turksatkablo.com.tr/turksatkablo.com.tr.channels.xml --output=guide.xml

const { parser, url } = require('./turksatkablo.com.tr.config.js')
const dayjs = require('dayjs')
const utc = require('dayjs/plugin/utc')
const customParseFormat = require('dayjs/plugin/customParseFormat')
dayjs.extend(customParseFormat)
dayjs.extend(utc)

const date = dayjs.utc('2021-10-25', 'YYYY-MM-DD').startOf('d')
const channel = { site_id: '283', xmltv_id: 'SinemaTV.tr', display_name: 'Sinema TV' }
const content = `{"k":[{"x":283,"i":2,"n":"Sinema TV","p":[{"a":"196432597608","b":"Ölüm Ormanı","c":"01:15","d":"03:00"},{"a":"196432597628","b":"Kızım","c":"15:00","d":"17:00"},{"a": "196441294843","b":"Kaçakçı","c":"23:45","d":"03:45"}]}]}`

it('can generate valid url', () => {
  const result = url({ date })
  expect(result).toBe('https://www.turksatkablo.com.tr/userUpload/EPG/y.json?_=1635120000000')
})

it('can parse response', () => {
  const result = parser({ date, channel, content }).map(p => {
    p.start = p.start.toJSON()
    p.stop = p.stop.toJSON()
    return p
  })
  expect(result).toMatchObject([
    {
      start: '2021-10-24T22:15:00.000Z',
      stop: '2021-10-25T00:00:00.000Z',
      title: 'Ölüm Ormanı'
    },
    {
      start: '2021-10-25T12:00:00.000Z',
      stop: '2021-10-25T14:00:00.000Z',
      title: 'Kızım'
    },
    {
      start: '2021-10-25T20:45:00.000Z',
      stop: '2021-10-26T00:45:00.000Z',
      title: 'Kaçakçı'
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
