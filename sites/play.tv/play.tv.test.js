jest.mock('axios', () => ({
  get: jest.fn()
}))

const axios = require('axios')
const { channels, parser, url } = require('./play.tv.config.js')
const fs = require('fs')
const path = require('path')
const dayjs = require('dayjs')
const utc = require('dayjs/plugin/utc')
const customParseFormat = require('dayjs/plugin/customParseFormat')

dayjs.extend(customParseFormat)
dayjs.extend(utc)

const date = dayjs.utc('2026-03-18', 'YYYY-MM-DD').startOf('d')
const channel = { site_id: 'play', xmltv_id: '' }
const content = fs.readFileSync(path.resolve(__dirname, '__data__/content.html'), 'utf8')

beforeEach(() => {
  axios.get.mockReset()
})

it('can generate valid url', () => {
  expect(url({ channel, date })).toBe('https://www.play.tv/tv-gids/play/2026-03-18')
})

it('can parse response', () => {
  const results = parser({ content, channel, date }).map(program => {
    program.start = program.start.toJSON()
    program.stop = program.stop.toJSON()
    return program
  })

  expect(results).toHaveLength(1)
  expect(results.find(program => program.title === 'Geen uitzending - PLAY')).toBeUndefined()
  expect(results[0]).toMatchObject({
    title: 'Huizenjagers',
    subTitle: 'Week 1: Gent',
    description: 'Vlaamse realityreeks over immo',
    category: 'Reality',
    season: 7,
    episode: 2,
    image:
      'https://images.play.tv/styles/0efe8c9a1a45511fe53ad47b02b82b32f480d1819874e6fb6d37c54cf9a2f5ea/meta/huizenjagers-y07-e02-f0274581mp400122602still004-qgsi74-qh79ly-qh79ly.jpg?style=W10=&sign=4e0abe87bc5d2922acf797fe1d11c9d64f80a3a1ec17bb9255c564e642605651',
    url: 'https://www.play.tv/video/huizenjagers/huizenjagers-s7/huizenjagers-s7-aflevering-2',
    start: '2026-03-18T10:40:00.000Z',
    stop: '2026-03-18T11:30:00.000Z'
  })
})

it('can parse channel list', async () => {
  axios.get.mockResolvedValue({ data: content })

  const results = await channels()

  expect(results).toMatchObject([
    { lang: 'nl', name: 'Play', site_id: 'play' },
    { lang: 'nl', name: 'Play Fictie', site_id: 'fictie' },
    { lang: 'nl', name: 'Play Actie', site_id: 'actie' },
    { lang: 'nl', name: 'Play Reality', site_id: 'reality' },
    { lang: 'nl', name: 'Play Crime', site_id: 'crime' }
  ])
})

it('can handle empty guide', () => {
  const results = parser({ content: '', channel, date })

  expect(results).toMatchObject([])
})