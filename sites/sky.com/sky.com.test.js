process.env.CURR_DATE = '2026-06-08'

const { channels, parser, request, url } = require('./sky.com.config.js')
const fs = require('fs')
const path = require('path')
const axios = require('axios')
const dayjs = require('dayjs')
const utc = require('dayjs/plugin/utc')
const customParseFormat = require('dayjs/plugin/customParseFormat')

dayjs.extend(customParseFormat)
dayjs.extend(utc)

jest.mock('axios')

const date = dayjs.utc('2026-06-08').startOf('d')
const channel = {
  lang: 'en',
  name: 'Sky History HD',
  site_id: 'GB#4086',
  xmltv_id: 'SkyHistory.uk@HD'
}
const uhdChannel = {
  lang: 'en',
  name: 'TNTUltimateUHD',
  site_id: 'GB#1336',
  xmltv_id: 'TNTSportsUltimate.uk@SD'
}

function mockScheduleRequest(url) {
  const urls = {
    20260608: 'content1.json',
    20260609: 'content2.json'
  }
  let data = ''
  const match = url.match(/\/schedule\/(\d{8})\/([^/]+)$/)
  if (match && match[2].split(',').includes('4086') && urls[match[1]] !== undefined) {
    data = fs.readFileSync(path.join(__dirname, '__data__', urls[match[1]])).toString()
  }
  return Promise.resolve({ data, headers: {}, request: {} })
}

beforeEach(() => {
  jest.clearAllMocks()
  axios.get.mockImplementation(mockScheduleRequest)
})

it('can generate valid url', () => {
  const result = url({ channel, date })
  const sids = result.split('/').pop().split(',')

  expect(result).toContain('https://awk.epgsky.com/hawk/linear/schedule/20260608/')
  expect(sids).toHaveLength(20)
  expect(sids).toContain('4086')
  expect(new Set(sids)).toHaveProperty('size', 20)

  const companion = {
    ...channel,
    site_id: `GB#${sids.find(sid => sid !== '4086')}`
  }
  expect(url({ channel: companion, date })).toBe(result)
})

it('falls back to a single SID for a channel outside the repository XML', () => {
  expect(url({ channel: { ...channel, site_id: 'GB#999999' }, date })).toBe(
    'https://awk.epgsky.com/hawk/linear/schedule/20260608/999999'
  )
})

it.each([
  ['TNTUltimateUHD', 'GB#1336', '1336'],
  ['Ultra HD', 'GB#7233', '7233'],
  ['Sky Sport 4k', 'IT#628', '628']
])('uses Atlantis for %s', (name, siteId, sid) => {
  const currentChannel = {
    ...channel,
    name,
    site_id: siteId
  }

  expect(url({ channel: currentChannel, date })).toBe(
    `https://atlantis.epgsky.com/as/schedule/20260608/${sid}`
  )
  expect(request.headers({ channel: currentChannel })).toEqual({
    'X-SkyOTT-Proposition': 'SKYQ',
    'X-SkyOTT-Provider': 'SKY',
    'X-SkyOTT-Territory': siteId.slice(0, 2)
  })
})

it('rejects an unsupported territory in the site ID', () => {
  expect(() => url({ channel: { ...channel, site_id: 'XX#4086' }, date })).toThrow(
    'Expected "<territory>#<sid>"'
  )
})

it('can generate territory headers from the site ID', () => {
  expect(request.headers({ channel })).toEqual({
    'X-SkyOTT-Territory': 'GB'
  })
  expect(request.headers({ channel: { ...channel, lang: 'en', site_id: 'DE#4086' } })).toEqual({
    'X-SkyOTT-Territory': 'DE'
  })
  expect(request.headers({ channel: { ...channel, lang: 'it', site_id: 'IT#4086' } })).toEqual({
    'X-SkyOTT-Territory': 'IT'
  })
  expect(request.headers({ channel: uhdChannel })).toEqual({
    'X-SkyOTT-Proposition': 'SKYQ',
    'X-SkyOTT-Provider': 'SKY',
    'X-SkyOTT-Territory': 'GB'
  })
  expect(request.cache.vary).toEqual(['X-SkyOTT-Territory'])
})

it('can parse response', async () => {
  const content = fs.readFileSync(path.join(__dirname, '__data__', 'content1.json'))
  const result = (await parser({ config: { days: 1 }, content, channel, date })).map(p => {
    p.start = p.start.toJSON()
    p.stop = p.stop.toJSON()
    return p
  })

  expect(result.length).toBe(30)
  expect(result[0]).toMatchObject({
    start: '2026-06-07T23:45:00.000Z',
    stop: '2026-06-08T00:45:00.000Z',
    title: 'The UnBelievable With Dan Aykroyd',
    description:
      "Bizarre Innovations: Discover bizarre innovations like a fully functioning car that hovers in midair. Or clothing made out of everyone's favorite source of calcium. (S2, ep 6)",
    season: 2,
    episode: 6,
    icon: 'https://images.metadata.sky.com/pd-image/007ade72-3239-47d7-a452-3070eb8e591d/16-9/640',
    image: 'https://images.metadata.sky.com/pd-image/007ade72-3239-47d7-a452-3070eb8e591d/16-9/640'
  })
  expect(result[29]).toMatchObject({
    start: '2026-06-08T23:00:00.000Z',
    stop: '2026-06-09T00:00:00.000Z',
    title: 'Digging For Britain',
    description:
      "The Tudors: Dr Alice Roberts pays tribute to the Bard, visiting Shakespeare's first theatre in London's Shoreditch and sifting through the poet's rubbish! (S1, ep 4)",
    season: 1,
    episode: 4,
    icon: 'https://images.metadata.sky.com/pd-image/68152ae7-97d6-44c8-8a54-e78710b94a76/16-9/640',
    image: 'https://images.metadata.sky.com/pd-image/68152ae7-97d6-44c8-8a54-e78710b94a76/16-9/640'
  })
  expect(axios.get).toHaveBeenCalledWith(url({ channel, date: date.add(1, 'd') }), {
    headers: {
      'X-SkyOTT-Territory': 'GB'
    }
  })
})

it('only loads a follow-up batch for the final requested date', async () => {
  await parser({
    config: { days: 2 },
    content: '',
    channel,
    date
  })
  expect(axios.get).not.toHaveBeenCalled()

  await parser({
    config: { days: 2 },
    content: '',
    channel,
    date: date.add(1, 'd')
  })
  expect(axios.get).toHaveBeenCalledTimes(1)
  expect(axios.get).toHaveBeenCalledWith(url({ channel, date: date.add(2, 'd') }), {
    headers: {
      'X-SkyOTT-Territory': 'GB'
    }
  })
})

it('loads a shared follow-up batch only once', async () => {
  const sids = url({ channel, date }).split('/').pop().split(',')
  const companion = {
    ...channel,
    site_id: `GB#${sids.find(sid => sid !== '4086')}`
  }
  const finalDate = date.add(2, 'd')

  await Promise.all([
    parser({ config: { days: 3 }, content: '', channel, date: finalDate }),
    parser({ config: { days: 3 }, content: '', channel: companion, date: finalDate })
  ])

  expect(axios.get).toHaveBeenCalledTimes(1)
  expect(axios.get).toHaveBeenCalledWith(url({ channel, date: finalDate.add(1, 'd') }), {
    headers: {
      'X-SkyOTT-Territory': 'GB'
    }
  })
})

it('loads an UHD follow-up schedule from Atlantis', async () => {
  const finalDate = date.add(1, 'd')

  await parser({
    config: { days: 2 },
    content: '',
    channel: uhdChannel,
    date: finalDate
  })

  expect(axios.get).toHaveBeenCalledTimes(1)
  expect(axios.get).toHaveBeenCalledWith('https://atlantis.epgsky.com/as/schedule/20260610/1336', {
    headers: {
      'X-SkyOTT-Proposition': 'SKYQ',
      'X-SkyOTT-Provider': 'SKY',
      'X-SkyOTT-Territory': 'GB'
    }
  })
})

it('can handle empty guide', async () => {
  const result = await parser({
    config: { days: 2 },
    date,
    channel,
    content: ''
  })
  expect(result).toMatchObject([])
})

it('keeps identical event IDs isolated by territory', async () => {
  const content = JSON.stringify({
    schedule: [
      {
        sid: '123',
        events: [
          {
            eid: 'shared-event',
            st: date.unix(),
            d: 3600,
            t: 'Shared event'
          }
        ]
      }
    ]
  })
  const englishChannel = { lang: 'en', site_id: 'GB#123' }
  const germanChannel = { lang: 'de', site_id: 'DE#123' }

  expect(await parser({ content, channel: englishChannel, date })).toHaveLength(1)
  expect(await parser({ content, channel: germanChannel, date })).toHaveLength(1)
  expect(await parser({ content, channel: englishChannel, date })).toHaveLength(0)
})

it('can load and deduplicate all territories by language and site ID', async () => {
  axios.get.mockImplementation((url, options) => {
    const territory = options.headers['X-SkyOTT-Territory']
    const titles = {
      DE: 'Sky One Deutschland HD',
      GB: 'Sky One HD',
      IT: 'Sky Uno HD'
    }

    if (url.endsWith('/regions')) {
      return Promise.resolve({
        data: {
          regions: [
            { bouquetId: 1, subBouquetId: 2 },
            { bouquetId: 1, subBouquetId: 2 }
          ]
        },
        headers: {},
        request: {}
      })
    }

    if (url.includes('atlantis.epgsky.com')) {
      return Promise.resolve({
        data: {
          services: [
            { schedule: true, sid: '123', t: `${titles[territory]} Atlantis` },
            { schedule: true, sid: '456', t: `${territory} UHD` },
            { schedule: false, sid: '789', t: `${territory} Internal` }
          ]
        },
        headers: {},
        request: {}
      })
    }

    return Promise.resolve({
      data: {
        services: [
          { sid: '123', t: titles[territory] },
          { sid: '123', t: titles[territory] },
          ...(territory === 'IT' ? [{ sid: '582' }] : [])
        ]
      },
      headers: {},
      request: {}
    })
  })

  const result = await channels()

  expect(result).toHaveLength(6)
  expect(result).toEqual(
    expect.arrayContaining([
      {
        lang: 'de',
        site_id: 'DE#123',
        name: 'Sky One Deutschland HD'
      },
      {
        lang: 'de',
        site_id: 'DE#456',
        name: 'DE UHD'
      },
      {
        lang: 'en',
        site_id: 'GB#123',
        name: 'Sky One HD'
      },
      {
        lang: 'en',
        site_id: 'GB#456',
        name: 'GB UHD'
      },
      {
        lang: 'it',
        site_id: 'IT#123',
        name: 'Sky Uno HD'
      },
      {
        lang: 'it',
        site_id: 'IT#456',
        name: 'IT UHD'
      }
    ])
  )
  expect(result).not.toEqual(
    expect.arrayContaining([
      expect.objectContaining({
        site_id: expect.stringMatching(/#789$/)
      })
    ])
  )
  expect(axios.get).toHaveBeenCalledTimes(9)
  expect(axios.get.mock.calls.map(([, options]) => options.headers)).toEqual(
    expect.arrayContaining([
      { 'X-SkyOTT-Territory': 'GB' },
      { 'X-SkyOTT-Territory': 'DE' },
      { 'X-SkyOTT-Territory': 'IT' },
      {
        'X-SkyOTT-Proposition': 'SKYQ',
        'X-SkyOTT-Provider': 'SKY',
        'X-SkyOTT-Territory': 'GB'
      },
      {
        'X-SkyOTT-Proposition': 'SKYQ',
        'X-SkyOTT-Provider': 'SKY',
        'X-SkyOTT-Territory': 'DE'
      },
      {
        'X-SkyOTT-Proposition': 'SKYQ',
        'X-SkyOTT-Provider': 'SKY',
        'X-SkyOTT-Territory': 'IT'
      }
    ])
  )
})

it('rejects unsupported channel territories', () => {
  expect(() => request.headers({ channel: { ...channel, site_id: 'FR#4086' } })).toThrow(
    'territory "DE", "GB" or "IT"'
  )
})

it('rejects an incomplete channel list', async () => {
  axios.get.mockImplementation((url, options) => {
    if (url.endsWith('/regions')) {
      return Promise.resolve({
        data: {
          regions: [{ bouquetId: 1, subBouquetId: 2 }]
        },
        headers: {},
        request: {}
      })
    }

    if (options.headers['X-SkyOTT-Territory'] === 'DE') {
      return Promise.resolve({
        data: {
          services: [{ sid: '123', t: 'Sky One Deutschland HD' }]
        },
        headers: {},
        request: {}
      })
    }

    return Promise.resolve({
      data: {},
      headers: {},
      request: {}
    })
  })

  await expect(channels()).rejects.toThrow('Unable to load complete Sky channel list')
})
