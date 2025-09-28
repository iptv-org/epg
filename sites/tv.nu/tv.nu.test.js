const fs = require('fs')
const path = require('path')
const { parser, url } = require('./tv.nu.config.js')
const dayjs = require('dayjs')
const utc = require('dayjs/plugin/utc')
const customParseFormat = require('dayjs/plugin/customParseFormat')
dayjs.extend(customParseFormat)
dayjs.extend(utc)

const date = dayjs.utc('2024-12-03', 'YYYY-MM-DD').startOf('d')
const channel = {
  site_id: '3sat',
  xmltv_id: '3sat.de'
}

it('can generate valid url', () => {
  expect(url({ channel, date })).toBe(
    'https://web-api.tv.nu/channels/3sat/schedule?date=2024-12-03&fullDay=true'
  )
})

it('can parse response', () => {
  const content = fs.readFileSync(path.join(__dirname, '__data__', 'content.json'))
  const result = parser({ content }).map(p => {
    p.start = p.start.toJSON()
    p.stop = p.stop.toJSON()
    return p
  })

  expect(result).toMatchObject([
    {
      start: '2024-12-03T11:50:00.000Z',
      stop: '2024-12-03T12:15:00.000Z',
      title: 'Natur im Garten',
      description:
        'Der Gartenbuchautor Karl Ploberger gibt in der Sendung Tipps und Tricks zur Gartenpflege.',
      category: ['Konsument', 'Underhållning', 'Trädgård'],
      season: 29,
      episode: 9
    }
  ])
})

it('can handle empty guide', () => {
  const content = fs.readFileSync(path.join(__dirname, '__data__', 'no_content.json'))
  const result = parser({ content })
  expect(result).toMatchObject([])
})
