const { parser, url } = require('./go3.ee.config.js')
const fs = require('fs')
const path = require('path')
const dayjs = require('dayjs')
const utc = require('dayjs/plugin/utc')
const customParseFormat = require('dayjs/plugin/customParseFormat')
dayjs.extend(customParseFormat)
dayjs.extend(utc)

const date = dayjs.utc('2026-04-10', 'YYYY-MM-DD').startOf('d')
const channel = { site_id: '443062' }

it('can generate valid url', () => {
  expect(url({ channel, date })).toBe(
    'https://go3.ee/api/products/lives/programmes?liveId%5B%5D=443062&since=2026-04-10T00%3A00%2B0000&till=2026-04-10T23%3A59%2B0000&platform=BROWSER&lang=ET&tenant=OM_EE'
  )
})

it('can parse response', () => {
  const content = fs.readFileSync(path.resolve(__dirname, '__data__/content.json'))

  const results = parser({ content }).map(p => {
    p.start = p.start.toJSON()
    p.stop = p.stop.toJSON()

    return p
  })

  expect(results.length).toBe(25)
  expect(results[0]).toMatchObject({
    title: 'Kaks kanget Argentiinas',
    description:
      'Kaks kanget avastavad Argentiina kuulsat veinipiirkonda Mendozat. Sõidetakse ka ühte mahajäetud kaevanduslinna ja laskutakse köiega sügavale hõbedakaevanduse šahtidesse, kus kaljuseintes sätendavad erinevad hinnalised metallid. Pärast tolmuseid mägiteid ja kaevandust nauditakse veemõnusid looduslikes kuumavee allikates. Aga päeva lõpetuseks ootab veel ees väikene ratsamatk. Mis, teadagi, Kristjanile sugugi ei meeldi ...',
    images: [
      'https://static3.go3.tv/scale/go3/images/epg_7e5e21dc120e3411d2109b28592bf182.jpeg?dsth=1080&dstw=1920&srcmode=0&quality=80&srcx=0&srcy=0&srcw=1/1&srch=1/1&type=2'
    ],
    category: 'Sarjad',
    start: '2026-04-09T23:15:00.000Z',
    stop: '2026-04-10T00:10:00.000Z'
  })
})

it('can handle empty guide', () => {
  const results = parser({ content: '[]' })

  expect(results).toMatchObject([])
})
