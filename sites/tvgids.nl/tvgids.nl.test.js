const { parser, url } = require('./tvgids.nl.config.js')
const fs = require('fs')
const path = require('path')
const dayjs = require('dayjs')
const utc = require('dayjs/plugin/utc')
const customParseFormat = require('dayjs/plugin/customParseFormat')
dayjs.extend(customParseFormat)
dayjs.extend(utc)

const date = dayjs.utc('2025-01-19', 'YYYY-MM-DD').startOf('d')
const channel = {
  site_id: 'npo1',
  xmltv_id: 'NPO1.nl'
}

it('can generate valid url', () => {
  jest.useFakeTimers().setSystemTime(new Date('2025-01-17'))

  expect(url({ date, channel })).toBe('https://www.tvgids.nl/gids/19-01-2025/npo1')
})

it('can generate valid url for today', () => {
  const today = dayjs().startOf('d')

  expect(url({ date: today, channel })).toBe('https://www.tvgids.nl/gids/npo1')
})

it('can parse response', () => {
  const content = fs.readFileSync(path.resolve(__dirname, '__data__/content.html'))
  const results = parser({ content, date }).map(p => {
    p.start = p.start.toJSON()
    p.stop = p.stop.toJSON()
    return p
  })

  expect(results[0]).toMatchObject({
    start: '2025-01-18T22:57:00.000Z',
    stop: '2025-01-18T23:58:00.000Z',
    title: 'Op1',
    image: 'https://tvgidsassets.nl/v301/upload/o/carrousel/op1-451542641.jpg',
    description: "Talkshow met wisselende presentatieduo's, live vanuit Amsterdam."
  })

  expect(results[61]).toMatchObject({
    start: '2025-01-20T01:18:00.000Z',
    stop: '2025-01-20T01:48:00.000Z',
    title: 'NOS Journaal',
    image: 'https://tvgidsassets.nl/v301/upload/n/carrousel/nos-journaal-452818771.jpg',
    description:
      'Met het laatste nieuws, gebeurtenissen van nationaal en internationaal belang en de weersverwachting voor vandaag.'
  })
})

it('can handle empty guide', () => {
  const result = parser({
    content: '',
    date
  })
  expect(result).toMatchObject([])
})
