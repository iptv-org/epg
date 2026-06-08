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
  expect(result[30]).toMatchObject({
    start: '2024-12-14T23:00:00.000Z',
    stop: '2024-12-15T01:00:00.000Z',
    title: 'American Godfathers: The Five Families',
    description:
      "Rise of the New Dons: Follow the conflict between the families' old guard and a new generation of younger, American-born mobsters willing to defy their authority. (S1, ep 2)",
    season: 1,
    episode: 2,
    icon: 'https://images.metadata.sky.com/pd-image/4e38c66b-c2ae-3669-a7ff-e7588743e7ac/16-9/640',
    image: 'https://images.metadata.sky.com/pd-image/4e38c66b-c2ae-3669-a7ff-e7588743e7ac/16-9/640'
  })
})

it('keeps BST early-morning programmes and drops the next local day', () => {
  // Sky buckets each schedule by UK *local* day, so a request for 8 June (BST,
  // UTC+1) returns events from 00:00 BST (23:00Z on the 7th) onwards. Four of the
  // five events below belong to the 8 June local day; the 00:30 BST 9 June event
  // sits on UTC day 8 but must NOT leak into the 8 June guide.
  const date = dayjs.utc('2026-06-08', 'YYYY-MM-DD').startOf('d')
  const content = fs.readFileSync(path.join(__dirname, '__data__', 'content_bst.json'))
  const result = parser({ content, channel, date }).map(p => {
    p.start = p.start.toJSON()
    p.stop = p.stop.toJSON()
    return p
  })

  expect(result.length).toBe(4)
  expect(result.map(p => p.title)).toEqual([
    'Midnight Show',
    'Quarter To One',
    'Midday Movie',
    'Late Night'
  ])

  // 00:00 BST: starts 23:00Z on the previous UTC day and never crosses UTC
  // midnight. A UTC-only start/stop check drops this; the local-day filter keeps it.
  expect(result[0]).toMatchObject({
    start: '2026-06-07T23:00:00.000Z',
    stop: '2026-06-07T23:30:00.000Z',
    title: 'Midnight Show',
    season: 1,
    episode: 1,
    icon: 'https://images.metadata.sky.com/pd-image/11111111-1111-1111-1111-111111111111/16-9/640',
    image: 'https://images.metadata.sky.com/pd-image/11111111-1111-1111-1111-111111111111/16-9/640'
  })

  // 00:45 BST, straddling UTC midnight (23:45Z -> 00:45Z) — the example from the PR thread.
  expect(result[1]).toMatchObject({
    start: '2026-06-07T23:45:00.000Z',
    stop: '2026-06-08T00:45:00.000Z',
    title: 'Quarter To One'
  })

  // Last programme of the local day, starting 23:30 BST.
  expect(result[3]).toMatchObject({
    start: '2026-06-08T22:30:00.000Z',
    stop: '2026-06-08T23:00:00.000Z',
    title: 'Late Night'
  })

  // 00:30 BST on 9 June (23:30Z on the 8th): on UTC day 8, but the next local day.
  expect(result.find(p => p.title === 'Next Day Breakfast')).toBeUndefined()
})

it('can handle empty guide', () => {
  const result = parser({
    date,
    channel,
    content: ''
  })
  expect(result).toMatchObject([])
})
