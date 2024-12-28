const { parser, url } = require('./sky.com.config.js')
const fs = require('fs')
const path = require('path')
const dayjs = require('dayjs')
const utc = require('dayjs/plugin/utc')
const customParseFormat = require('dayjs/plugin/customParseFormat')

dayjs.extend(customParseFormat)
dayjs.extend(utc)

const date = dayjs.utc('2024-12-14', 'YYYY-MM-DD').startOf('d')
const channel = {
  site_id: '4086',
  xmltv_id: 'SkyHistoryHD.uk'
}

it('can generate valid url', () => {
  expect(url({ channel, date })).toBe(
    'https://awk.epgsky.com/hawk/linear/schedule/20241214/4086'
  )
})

it('can parse response', () => {
  const content = fs.readFileSync(path.join(__dirname, '__data__', 'content.json'))
  const result = parser({ content, channel, date }).map(p => {
    p.start = p.start.toJSON()
    p.stop = p.stop.toJSON()
    return p
  })

  expect(result.length).toBe(33)
  expect(result[0]).toMatchObject({
    start: '2024-12-13T22:00:00.000Z',
    stop: '2024-12-13T23:00:00.000Z',
    title: 'The UnXplained With...',
    description:
      'The Hunt for Jack the Ripper: Jack the Ripper\'s identity has eluded police, historians and armchair detectives for over a century. What do we know about the notorious killer? (S3, ep 21)',
    season: 4,
    episode: 14
  })
  expect(result[4]).toMatchObject({
    start: '2024-12-14T01:00:00.000Z',
    stop: '2024-12-14T01:30:00.000Z',
    title: 'Storage Wars',
    description:
      'Not All That Glitters Is Gourd: Back in the city of Orange, the Vegas Ladies arrive in vintage style - though not everyone agrees. (S12, ep 6)',
    season: 12,
    episode: 6
  })
})

it('can handle empty guide', () => {
  const result = parser({
    date,
    channel,
    content: ''
  })
  expect(result).toMatchObject([])
})
