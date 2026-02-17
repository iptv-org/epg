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
  expect(url({ channel, date })).toBe('https://awk.epgsky.com/hawk/linear/schedule/20241214/4086')
})

it('can parse response', () => {
  const content = fs.readFileSync(path.join(__dirname, '__data__', 'content.json'))
  const result = parser({ content, channel, date }).map(p => {
    p.start = p.start.toJSON()
    p.stop = p.stop.toJSON()
    return p
  })

  expect(result.length).toBe(31)
  expect(result[0]).toMatchObject({
    start: '2024-12-14T00:00:00.000Z',
    stop: '2024-12-14T00:30:00.000Z',
    title: 'Storage Wars',
    description:
      'A Sale Of Two Cities: Emily brings her mother along with her to Walnut, and Darrell wastes no time finding an advantage. Ivy and Ivy jr clean up with their locker. (S12, ep 4)',
    season: 12,
    episode: 4,
    icon: 'https://images.metadata.sky.com/pd-image/b9572a38-8db7-471e-a2d7-462e1dd26af2/16-9/640',
    image: 'https://images.metadata.sky.com/pd-image/b9572a38-8db7-471e-a2d7-462e1dd26af2/16-9/640'
  })
  expect(result[2]).toMatchObject({
    start: '2024-12-14T01:00:00.000Z',
    stop: '2024-12-14T01:30:00.000Z',
    title: 'Storage Wars',
    description:
      'Not All That Glitters Is Gourd: Back in the city of Orange, the Vegas Ladies arrive in vintage style - though not everyone agrees. (S12, ep 6)',
    season: 12,
    episode: 6,
    icon: 'https://images.metadata.sky.com/pd-image/e9521ccc-bdcc-4075-9c2e-bc835247148b/16-9/640',
    image: 'https://images.metadata.sky.com/pd-image/e9521ccc-bdcc-4075-9c2e-bc835247148b/16-9/640'
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
