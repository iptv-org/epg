const { parser, url } = require('./tv.blue.ch.config.js')
const dayjs = require('dayjs')
const utc = require('dayjs/plugin/utc')
const fs = require('fs')
const path = require('path')
const customParseFormat = require('dayjs/plugin/customParseFormat')
dayjs.extend(customParseFormat)
dayjs.extend(utc)

const date = dayjs.utc('2022-01-17', 'YYYY-MM-DD').startOf('d')
const channel = {
  site_id: '1221',
  xmltv_id: 'BlueZoomD.ch'
}

it('can generate valid url', () => {
  expect(url({ channel, date })).toBe(
    'https://services.sg101.prd.sctv.ch/catalog/tv/channels/list/(ids=1221;start=202201170000;end=202201180000;level=normal)'
  )
})

it('can parse response', () => {
  const content = fs.readFileSync(path.resolve(__dirname, '__data__/content.json'))
  const result = parser({ content }).map(p => {
    p.start = p.start.toJSON()
    p.stop = p.stop.toJSON()
    return p
  })

  expect(result).toMatchObject([
    {
      start: '2022-01-16T23:30:00.000Z',
      stop: '2022-01-17T00:00:00.000Z',
      title: 'Weekend on the Rocks',
      description:
        ' - «R.E.S.P.E.C.T», lieber Charles Nguela. Der Comedian tourt fleissig durch die Schweiz, macht für uns aber einen Halt, um in der neuen Ausgabe von «Weekend on the Rocks» mit Moderatorin Vania Spescha über die Entertainment-News der Woche zu plaudern.',
      image:
        'https://services.sg101.prd.sctv.ch/content/images/tv/broadcast/1221/t1221ddc59247d45_landscape_w1920.webp'
    }
  ])
})

it('can parse response without image', () => {
  const content = fs.readFileSync(path.resolve(__dirname, '__data__/content_without_image.json'))
  const result = parser({ content }).map(p => {
    p.start = p.start.toJSON()
    p.stop = p.stop.toJSON()
    return p
  })

  expect(result).toMatchObject([
    {
      start: '2022-01-17T04:59:00.000Z',
      stop: '2022-01-17T05:00:00.000Z',
      title: 'Lorem ipsum'
    }
  ])
})

it('can handle wrong site id', () => {
  const result = parser({
    content: fs.readFileSync(path.resolve(__dirname, '__data__/content_invalid_siteid.json'))
  })
  expect(result).toMatchObject([])
})

it('can handle empty guide', () => {
  const result = parser({
    content: fs.readFileSync(path.resolve(__dirname, '__data__/no_content.json'))
  })
  expect(result).toMatchObject([])
})
