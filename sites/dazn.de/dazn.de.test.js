const fs = require('fs')
const path = require('path')
const axios = require('axios')
const dayjs = require('dayjs')
const utc = require('dayjs/plugin/utc')
const customParseFormat = require('dayjs/plugin/customParseFormat')
const { channels, parser, url } = require('./dazn.de.config.js')

dayjs.extend(utc)
dayjs.extend(customParseFormat)

jest.mock('axios')

const date = dayjs.utc('2026-07-19', 'YYYY-MM-DD').startOf('day')
const channel = { site_id: 'bj5o60qt6uoe1clfdsev239pr' }
const content = fs.readFileSync(path.resolve(__dirname, '__data__/content.json'), 'utf8')

it('can generate valid url', () => {
  expect(url({ channel })).toBe(
    'https://rail-router.discovery.indazn.com/eu/v10/Rail?platform=web&id=Livetvschedule&country=de&brand=dazn&languageCode=de'
  )
})

it('can generate regional url', () => {
  expect(url({ channel: { site_id: 'es#asset-id', lang: 'es' } })).toBe(
    'https://rail-router.discovery.indazn.com/eu/v10/Rail?platform=web&id=Livetvschedule&country=es&brand=dazn&languageCode=es'
  )
})

it('can parse response', () => {
  const results = parser({ content, channel, date })

  expect(results).toHaveLength(3)
  expect(results[0]).toMatchObject({
    title: 'Spanish Copa del Rey Soccer',
    subTitle: 'Atlético Madrid - FC Barcelona',
    description: 'Aus dem Riyadh Air Metropolitano in Madrid, Spanien.',
    categories: ['Soccer', 'Sports event'],
    date: '2026',
    start: '2026-07-19T15:00:00Z',
    stop: '2026-07-19T17:00:00Z',
    icon: 'https://image.discovery.indazn.com/eu/v3/linear-channel/none/111745_2026-07-19_EP037460110300_108429740567_2026-02-13T20%3A01%3A23Z_GNLZZGG002QL9SB/fill/center/center/none/80/856/481/webp/image?brand=dazn'
  })
  expect(results[2]).toMatchObject({
    title: 'Best of DAZN - Highlights',
    description: 'Bei Best of DAZN erwarten euch ausgewählte Highlights.',
    categories: ['Entertainment', 'Sports non-event'],
    start: '2026-07-19T17:50:00Z',
    stop: '2026-07-19T18:10:00Z'
  })
})

it('can filter response by date', () => {
  const results = parser({ content, channel, date: date.add(1, 'day') })

  expect(results).toHaveLength(1)
  expect(results[0]).toMatchObject({
    title: 'Bundesliga Soccer',
    start: '2026-07-20T06:00:00Z',
    stop: '2026-07-20T07:05:00Z'
  })
})

it('can handle empty guide', () => {
  expect(parser({ content: '', channel, date })).toEqual([])
  expect(parser({ content, channel: { site_id: '9dmerrb96eue11mjxhgbnyjho' }, date })).toEqual([])
})

it('can create channel list', async () => {
  axios.get.mockResolvedValue({ data: JSON.parse(content) })

  const results = await channels({ country: 'de' })

  expect(results).toHaveLength(2)
  expect(results[0]).toMatchObject({
    lang: 'de',
    site_id: 'bj5o60qt6uoe1clfdsev239pr',
    name: 'DAZN 1',
    logo: 'https://image.discovery.indazn.com/eu/v3/linear-channel/none/Logo_LTV_DAZN_1/contain/center/center/none/80/68/56/png/image?brand=dazn'
  })
  expect(results[0]).not.toHaveProperty('xmltv_id')
})

it('can create one deduplicated channel list', async () => {
  axios.get.mockClear()
  axios.get.mockResolvedValue({ data: JSON.parse(content) })

  const results = await channels()

  expect(axios.get).toHaveBeenCalledTimes(235)
  expect(results).toHaveLength(18)
  expect(results).toEqual(
    expect.arrayContaining([
      expect.objectContaining({ lang: 'de', site_id: 'bj5o60qt6uoe1clfdsev239pr' }),
      expect.objectContaining({ lang: 'es', site_id: 'es#bj5o60qt6uoe1clfdsev239pr' }),
      expect.objectContaining({ lang: 'en', site_id: 'gb#bj5o60qt6uoe1clfdsev239pr' })
    ])
  )

  const keys = results.map(result => {
    const assetId = result.site_id.includes('#') ? result.site_id.split('#')[1] : result.site_id

    return `${assetId}#${result.lang}`
  })
  expect(new Set(keys).size).toBe(results.length)
})

it('can create regional channel list', async () => {
  axios.get.mockResolvedValue({ data: JSON.parse(content) })

  const results = await channels({ country: 'es', lang: 'es' })

  expect(axios.get).toHaveBeenCalledWith(
    'https://rail-router.discovery.indazn.com/eu/v10/Rail?platform=web&id=Livetvschedule&country=es&brand=dazn&languageCode=es',
    expect.any(Object)
  )
  expect(results[0]).toMatchObject({
    lang: 'es',
    site_id: 'es#bj5o60qt6uoe1clfdsev239pr',
    name: 'DAZN 1'
  })
})
