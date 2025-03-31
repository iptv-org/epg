const { parser, url } = require('./mtel.ba.config.js')
const fs = require('fs')
const path = require('path')
const dayjs = require('dayjs')
const utc = require('dayjs/plugin/utc')
const customParseFormat = require('dayjs/plugin/customParseFormat')
dayjs.extend(customParseFormat)
dayjs.extend(utc)

const date = dayjs.utc('2025-02-04', 'YYYY-MM-DD').startOf('d')
const channel = { site_id: 'msat#ch-11-rtrs' }

it('can generate valid url', () => {
  expect(url({ date, channel })).toBe(
    'https://mtel.ba/hybris/ecommerce/b2c/v1/products/channels/epg?platform=tv-msat&currentPage=0&pageSize=1000&date=2025-02-04'
  )
})

it('can parse response', () => {
  const content = fs.readFileSync(path.resolve(__dirname, '__data__/content.json'))
  let results = parser({ channel, content })
  results = results.map(p => {
    p.start = p.start.toJSON()
    p.stop = p.stop.toJSON()

    return p
  })

  expect(results.length).toBe(38)
  expect(results[0]).toMatchObject({
    start: '2025-02-03T22:38:00.000Z',
    stop: '2025-02-03T23:38:00.000Z',
    title: 'Neka pesma kaže',
    image:
      'https://medias.services.mtel.ba/medias/407368591.jpg?context=bWFzdGVyfHJvb3R8MTM2MTZ8aW1hZ2UvanBlZ3xhR1F5TDJnell5ODBOekExTmpFMk1qRTJNRFkzTUM4ME1EY3pOamcxT1RFdWFuQm58ZWM3Zjc4MDNlZTY5OWU1ZGJiZDI5N2UzMDg4ODA3NzQ1NWM0OThlMjdhYmU4MjI4NGJhOWE2YzYwMTc5ODM3NQ',
    description:
      'Zabavni-muzički program donosi nam divne zvukove prave, narodne muzike, u kojoj se izvođači oslanjaju na kvalitet i tradiciju.',
    categories: ['Music', 'Ballet', 'Dance']
  })
  expect(results[37]).toMatchObject({
    start: '2025-02-04T22:27:00.000Z',
    stop: '2025-02-04T23:58:00.000Z',
    title: 'Bitanga s plaže',
    image:
      'https://medias.services.mtel.ba/medias/117604203.jpg?context=bWFzdGVyfHJvb3R8MTY1MTZ8aW1hZ2UvanBlZ3xhRGd6TDJnek1DODBOekExTmpFMk16STNORGM0TWk4eE1UYzJNRFF5TURNdWFuQm58YmU5MjdkOTljMGE4YjIyNjg3ZmI1YWJjYWQ0ZDY5YjA0YWJiY2RlN2E0ZGVjOTdlYzM4MzI4MzYyMzFiODBlMg',
    description:
      'Film prati urnebesne avanture Moondoga, buntovnika i skitnicu koji svoj život živi isključivo prema vlastitim pravilima. Uz glumačke nastupe Snoop Dogga, Zaca Efrona i Isle Fisher, Bitanga s plaže osvježavajuće je originalna i subverzivna nova komedija scenarista i redatelja Harmonyja Korinea.',
    categories: ['Movie', 'Drama']
  })
})

it('can handle empty guide', () => {
  const results = parser({
    channel,
    content: '{}'
  })
  expect(results).toMatchObject([])
})
