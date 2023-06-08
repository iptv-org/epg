// npx epg-grabber --config=sites/programtv.onet.pl/programtv.onet.pl.config.js --channels=sites/programtv.onet.pl/programtv.onet.pl.channels.xml --output=guide.xml

const MockDate = require('mockdate')
const { parser, url } = require('./programtv.onet.pl.config.js')
const dayjs = require('dayjs')
const utc = require('dayjs/plugin/utc')
const customParseFormat = require('dayjs/plugin/customParseFormat')
dayjs.extend(customParseFormat)
dayjs.extend(utc)

const date = dayjs.utc('2021-11-24', 'YYYY-MM-DD').startOf('d')
const channel = {
  site_id: '13th-street-250',
  xmltv_id: '13thStreet.de'
}
const content = `<!DOCTYPE html><html lang="pl"> <head></head> <body class="withFilters pageChannel"> <div id="channelPage"> <div id="channelTV" class="nextToMenu"> <section class="channelEmissions"> <header> <span class="logoTV"> <img src="//ocdn.eu/ptv2-images-transforms/1/zB4kr1sb2dvLW1pZ3JhdGVkLzEzdGgtc3RyZWV0LnBuZ5KVAmQAwsOVAgAowsM" alt="13th Street"/> </span> </header> <div class="emissions"> <ul> <li class="hh03 hh04 fltrSerie"> <div class="hours"> <span class="hour">03:20</span> </div><div class="titles"> <a href="/tv/law-and-order-odcinek-15/rlmzu?entry=21970867" >Law &amp; Order, odc. 15: Letzte Worte</a > <span class="type">Krimiserie</span> <p> Bei einer Reality-TV-Show stirbt einer der Teilnehmer. Zunächst tappen Briscoe (Jerry Orbach) und Green (Jesse L.... </p></div></li><li class="hh23 hh00 fltrSerie"> <div class="hours"> <span class="hour">23:30</span> </div><div class="titles"> <a href="/tv/navy-cis-odcinek-1/73vbw?entry=22035734" >Navy CIS, odc. 1: New Orleans</a > <span class="type">Krimiserie</span> <p> Der Abgeordnete Dan McLane, ein ehemaliger Vorgesetzter von Gibbs, wird in New Orleans ermordet. In den 90er Jahren... </p></div></li><li class="hh01 fltrSerie"> <div class="hours"> <span class="hour">01:00</span> </div><div class="titles"> <a href="/tv/navy-cis-la-odcinek-13/tuc34?entry=22035821" >Navy CIS: L.A, odc. 13: High Society</a > <span class="type">Krimiserie</span> <p> Die Zahl der Drogentoten ist gestiegen. Das Team des NCIS glaubt, dass sich Terroristen durch den zunehmenden... </p></div></li></ul> </div></section> </div></div></body></html>`

it('can generate valid url', () => {
  MockDate.set(dayjs.utc('2021-11-24', 'YYYY-MM-DD').startOf('d'))
  expect(url({ channel, date })).toBe(
    'https://programtv.onet.pl/program-tv/13th-street-250?dzien=0'
  )
  MockDate.reset()
})

it('can generate valid url for next day', () => {
  MockDate.set(dayjs.utc('2021-11-23', 'YYYY-MM-DD').startOf('d'))
  expect(url({ channel, date })).toBe(
    'https://programtv.onet.pl/program-tv/13th-street-250?dzien=1'
  )
  MockDate.reset()
})

it('can parse response', () => {
  const result = parser({ content, date }).map(p => {
    p.start = p.start.toJSON()
    p.stop = p.stop.toJSON()
    return p
  })

  expect(result).toMatchObject([
    {
      start: '2021-11-24T02:20:00.000Z',
      stop: '2021-11-24T22:30:00.000Z',
      title: `Law & Order, odc. 15: Letzte Worte`,
      category: 'Krimiserie',
      description: `Bei einer Reality-TV-Show stirbt einer der Teilnehmer. Zunächst tappen Briscoe (Jerry Orbach) und Green (Jesse L....`
    },
    {
      start: '2021-11-24T22:30:00.000Z',
      stop: '2021-11-25T00:00:00.000Z',
      title: `Navy CIS, odc. 1: New Orleans`,
      category: 'Krimiserie',
      description:
        'Der Abgeordnete Dan McLane, ein ehemaliger Vorgesetzter von Gibbs, wird in New Orleans ermordet. In den 90er Jahren...'
    },
    {
      start: '2021-11-25T00:00:00.000Z',
      stop: '2021-11-25T01:00:00.000Z',
      title: `Navy CIS: L.A, odc. 13: High Society`,
      category: 'Krimiserie',
      description:
        'Die Zahl der Drogentoten ist gestiegen. Das Team des NCIS glaubt, dass sich Terroristen durch den zunehmenden...'
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
