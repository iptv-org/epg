// npx epg-grabber --config=sites/turksatkablo.com.tr/turksatkablo.com.tr.config.js --channels=sites/turksatkablo.com.tr/turksatkablo.com.tr_tr.channels.xml --days=2 --output=.gh-pages/guides/tr/turksatkablo.com.tr.epg.xml

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
  const result = parser({ date, channel, content })
  expect(result[0]).toMatchObject({
    start: 'Sun, 24 Oct 2021 22:15:00 GMT',
    stop: 'Mon, 25 Oct 2021 00:00:00 GMT',
    title: 'Ölüm Ormanı'
  })
  expect(result[2]).toMatchObject({
    start: 'Mon, 25 Oct 2021 20:45:00 GMT',
    stop: 'Tue, 26 Oct 2021 00:45:00 GMT',
    title: 'Kaçakçı'
  })
})
