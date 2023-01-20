// npx epg-grabber --config=sites/sky.co.nz/sky.co.nz.config.js --channels=sites/sky.co.nz/sky.co.nz.channels.xml --output=guide.xml --days=2

const { parser, url } = require('./sky.co.nz.config.js')
const fs = require('fs')
const path = require('path')
const dayjs = require('dayjs')
const utc = require('dayjs/plugin/utc')
dayjs.extend(utc)

const date = dayjs.utc('2023-01-21', 'YYYY-MM-DD').startOf('d')
const channel = {
  site_id: '36',
  xmltv_id: 'SkyMoviesFamily.nz'
}
it('can generate valid url', () => {
  expect(url({ date, channel })).toBe(
    'https://web-epg.sky.co.nz/prod/epgs/v1?channelNumber=36&start=1674259200000&end=1674345600000&limit=20000'
  )
})

it('can parse response', () => {
  const content = fs.readFileSync(path.resolve(__dirname, '__data__/content.json'))
  const result = parser({ content }).map(p => {
    p.start = p.start.toJSON()
    p.stop = p.stop.toJSON()
    return p
  })

  expect(result[0]).toMatchObject({
    title: 'Sing 2',
    description: `Animated: Buster Moon and his friends must persuade the world's most reclusive rock star to help launch their most dazzling extravaganza yet. Voices Of: Matthew McConaughey, Reese Witherspoon (2021)`,
    category: ['Animated'],
    rating: { system: 'OFLC', value: 'PG' },
    start: '2023-01-20T23:41:00.000Z',
    stop: '2023-01-21T01:28:00.000Z'
  })

  expect(result[5]).toMatchObject({
    title: 'Harry Potter and the Goblet of Fire',
    description: `Adventure: Harry is selected to represent Hogwarts at a legendary and dangerous wizardry competition between three schools of magic. Stars: Daniel Radcliffe, Rupert Grint (2005)`,
    category: ['Action/Adventure'],
    rating: { system: 'OFLC', value: 'M-V' },
    start: '2023-01-21T07:42:00.000Z',
    stop: '2023-01-21T10:13:00.000Z'
  })
})

it('can handle empty guide', () => {
  const result = parser(
    {
      content: `{
        "code": "DATE_FORMAT_ERROR",
        "description": "DateFormat error",
        "message": "Unparseable date: x"
        }`
    },
    channel
  )
  expect(result).toMatchObject([])
})