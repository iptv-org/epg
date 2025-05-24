const { parser, url } = require('./turksatkablo.com.tr.config.js')
const dayjs = require('dayjs')
const utc = require('dayjs/plugin/utc')
const customParseFormat = require('dayjs/plugin/customParseFormat')
dayjs.extend(customParseFormat)
dayjs.extend(utc)

const date = dayjs.utc('2025-05-20', 'YYYY-MM-DD').startOf('d')
const channel = { site_id: '1908', xmltv_id: 'SinemaTV.tr', display_name: 'Sinema TV' }
const content =
  '{"k":[{"x":283,"i":2,"n":"Sinema TV","p":[{"a":"0","b":"-","c":"00:00","d":"01:15"},{"a":"196613862809","b":"Lanetli Kan","c":"01:15","d":"03:15"},{"a":"196613862810","b":"Downtown Owl","c":"03:15","d":"05:00"},{"a":"196613862812","b":"Kendimizden Büyük","c":"05:00","d":"07:00"},{"a":"196613862815","b":"Çıkış Planı","c":"07:00","d":"08:45"},{"a":"196613862816","b":"Ayrı Dünyalar","c":"08:45","d":"10:45"},{"a":"196613862819","b":"Bir Kızla Tanıştım","c":"10:45","d":"12:45"},{"a":"196613862822","b":"Always Amore","c":"12:45","d":"14:30"},{"a":"196613862825","b":"Yumrukları Gevşetmek","c":"14:30","d":"16:00"},{"a":"196613862828","b":"Uzun Mesafe","c":"16:00","d":"18:00"},{"a":"196613862830","b":"Son Gece","c":"18:00","d":"19:45"},{"a":"196613862831","b":"Yaşamak","c":"19:45","d":"21:30"},{"a":"196613862833","b":"Saman Altında Su","c":"21:30","d":"23:45"},{"a":"196613862836","b":"Sessiz Gece","c":"23:45","d":"01:30"}]}'

it('can generate valid url', () => {
  const result = url({ date })
  expect(result).toBe(`https://www.turksatkablo.com.tr/userUpload/EPG/${dayOfMonth}.json?_=1747699200000`)
})

it('can parse response', () => {
  const result = parser({ date, channel, content }).map(p => {
    p.start = p.start.toJSON()
    p.stop = p.stop.toJSON()
    return p
  })
  expect(result).toMatchObject([
    {
      start: '2025-05-21T00:00:00.000Z',
      stop: '2025-05-21T01:15:00.000Z',
      title: '-'
    },
    {
      start: '2025-05-21T01:15:00.000Z',
      stop: '2025-05-21T03:15:00.000Z',
      title: 'Lanetli Kan'
    },
    {
      start: '2025-05-21T03:15:00.000Z',
      stop: '2025-05-21T05:00:00.000Z',
      title: 'Downtown Owl'
    },
    {
      start: '2025-05-21T05:00:00.000Z',
      stop: '2025-05-21T07:00:00.000Z',
      title: 'Kendimizden Büyük'
    },
    {
      start: '2025-05-21T07:00:00.000Z',
      stop: '2025-05-21T08:45:00.000Z',
      title: 'Çıkış Planı'
    },
    {
      start: '2025-05-21T08:45:00.000Z',
      stop: '2025-05-21T10:45:00.000Z',
      title: 'Ayrı Dünyalar'
    },
    {
      start: '2025-05-21T10:45:00.000Z',
      stop: '2025-05-21T12:45:00.000Z',
      title: 'Bir Kızla Tanıştım'
    },
    {
      start: '2025-05-21T12:45:00.000Z',
      stop: '2025-05-21T14:30:00.000Z',
      title: 'Always Amore'
    },
    {
      start: '2025-05-21T14:30:00.000Z',
      stop: '2025-05-21T16:00:00.000Z',
      title: 'Yumrukları Gevşetmek'
    },
    {
      start: '2025-05-21T16:00:00.000Z',
      stop: '2025-05-21T18:00:00.000Z',
      title: 'Uzun Mesafe'
    },
    {
      start: '2025-05-21T18:00:00.000Z',
      stop: '2025-05-21T19:45:00.000Z',
      title: 'Son Gece'
    },
    {
      start: '2025-05-21T19:45:00.000Z',
      stop: '2025-05-21T21:30:00.000Z',
      title: 'Yaşamak'
    },
    {
      start: '2025-05-21T21:30:00.000Z',
      stop: '2025-05-21T23:45:00.000Z',
      title: 'Saman Altında Su'
    },
    {
      start: '2025-05-21T23:45:00.000Z',
      stop: '2025-05-22T01:30:00.000Z',
      title: 'Sessiz Gece'
    }
  ])
})

it('can handle empty guide', () => {
  const result = parser({
    date,
    channel,
    content: '<!DOCTYPE html><html><head></head><body></body></html>'
  })
  expect(result).toMatchObject([])
})
