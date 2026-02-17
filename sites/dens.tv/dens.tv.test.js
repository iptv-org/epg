const { url, parser } = require('./dens.tv.config.js')
const fs = require('fs')
const path = require('path')
const dayjs = require('dayjs')
const utc = require('dayjs/plugin/utc')

dayjs.extend(utc)

const date = dayjs.utc('2024-11-24').startOf('d')
const channel = { site_id: '38', xmltv_id: 'AniplusAsia.sg', lang: 'id' }

it('can generate valid url', () => {
  expect(url({ channel, date })).toBe(
    'https://www.dens.tv/api/dens3/tv/TvChannels/listEpgByDate?date=2024-11-24&id_channel=38&app_type=10'
  )
})

it('can parse response', () => {
  const content = fs.readFileSync(path.resolve(__dirname, '__data__/content.json'))
  let results = parser({ content })
  results = results.map(p => {
    p.start = p.start.toJSON()
    p.stop = p.stop.toJSON()
    return p
  })

  expect(results.length).toBe(2)

  expect(results[0]).toMatchObject({
    start: '2024-11-23T17:00:00.000Z',
    stop: '2024-11-23T17:30:00.000Z',
    title: 'Migi & Dali Episode 2',
    episode: 2
  })

  expect(results[1]).toMatchObject({
    start: '2024-11-23T19:30:00.000Z',
    stop: '2024-11-23T20:00:00.000Z',
    title: 'Attack on Titan Season 3 Episode 7',
    season: 3,
    episode: 7
  })
})

it('can handle empty guide', () => {
  const content = fs.readFileSync(path.resolve(__dirname, '__data__/no_content.json'))
  const results = parser({ content })

  expect(results).toMatchObject([])
})
