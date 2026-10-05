const fs = require('fs')
const path = require('path')
const crypto = require('crypto')
const dayjs = require('dayjs')
const utc = require('dayjs/plugin/utc')
const customParseFormat = require('dayjs/plugin/customParseFormat')

dayjs.extend(customParseFormat)
dayjs.extend(utc)

jest.mock('axios')

const fixture = JSON.parse(fs.readFileSync(path.resolve(__dirname, '__data__/content.json'), 'utf8'))
const date = dayjs.utc('2026-05-11', 'YYYY-MM-DD').startOf('d')
const channel = {
  site_id: '262270504164',
  xmltv_id: 'Sat1.de'
}

beforeEach(() => {
  jest.resetModules()
  jest.restoreAllMocks()
})

function loadConfig() {
  const axios = require('axios')
  const config = require('./www.magenta.tv.config.js')

  return {
    axios,
    ...config
  }
}

it('can generate valid url', async () => {
  const { axios, url } = loadConfig()

  jest
    .spyOn(crypto, 'randomUUID')
    .mockReturnValueOnce('device-id')
    .mockReturnValueOnce('session-id')
    .mockReturnValueOnce('manifest-call-id')
    .mockReturnValueOnce('schedule-call-id')

  axios.get.mockImplementation(url => {
    if (url === 'https://prod.dcm.telekom-dienste.de/v1/settings/web-mtv/manifest') {
      return Promise.resolve({ data: fixture.manifest })
    }

    return Promise.reject(new Error('unexpected request'))
  })

  const result = await url({ channel, date })

  expect(result).toBe(
    'https://feed.entertainment.tv.theplatform.eu/f/mdeprod/mdeprod-all-channel-schedules?byId=262270504164&byListingTime=2026-05-11T00%3A00%3A00.000Z%7E2026-05-12T00%3A00%3A00.000Z&byLocationId=http%3A%2F%2Fdata.entertainment.tv.theplatform.eu%2Fentertainment%2Fdata%2FLocation%2F245991976396&cid=session-id%3A%3Aschedule-call-id'
  )

  expect(axios.get).toHaveBeenCalledWith(
    'https://prod.dcm.telekom-dienste.de/v1/settings/web-mtv/manifest',
    expect.objectContaining({
      headers: {
        'X-DT-Call-ID': 'manifest-call-id',
        'X-DT-Session-ID': 'session-id'
      },
      params: expect.objectContaining({
        deviceId: 'device-id',
        sid: 'session-id',
        deviceModel: 'WEB2_FTV',
        portal: 'release',
        subscriberType: 'FTV_FREEMIUM_DT',
        $redirect: false
      })
    })
  )
})

it('can map a channel feed entry', () => {
  const { axios, channels } = loadConfig()

  axios.get.mockImplementation((url) => {
    if (url === 'https://prod.dcm.telekom-dienste.de/v1/settings/web-mtv/manifest') {
      return Promise.resolve({ data: fixture.manifest })
    }

    if (new URL(url).searchParams.get('range') === '1-100') {
      return Promise.resolve({ data: fixture.channels })
    }

    return Promise.resolve({ data: { entries: [] } })
  })

  return channels().then(result => {
    expect(result[0]).toMatchObject({
      lang: 'de',
      site_id: '259549736360',
      name: 'Das Erste'
    })
  })
})

it('can ignore radio channels', async () => {
  const { axios, channels } = loadConfig()

  axios.get.mockImplementation((url) => {
    if (url === 'https://prod.dcm.telekom-dienste.de/v1/settings/web-mtv/manifest') {
      return Promise.resolve({ data: fixture.manifest })
    }

    if (new URL(url).searchParams.get('range') === '1-100') {
      return Promise.resolve({ data: fixture.channels })
    }

    return Promise.resolve({ data: { entries: [] } })
  })

  const result = await channels()

  expect(result).toHaveLength(1)
  expect(result[0].name).toBe('Das Erste')
})

it('can paginate channels', async () => {
  const { axios, channels } = loadConfig()

  jest
    .spyOn(crypto, 'randomUUID')
    .mockReturnValueOnce('device-id')
    .mockReturnValueOnce('session-id')
    .mockReturnValueOnce('manifest-call-id')
    .mockImplementation(() => 'call-id')

  const page1 = {
    entries: Array.from({ length: 100 }, (_, index) => ({
      id: `http://data.entertainment.tv.theplatform.eu/entertainment/data/ChannelSchedule/${1000 + index}`,
      title: `Channel ${index + 1}`,
      stations: {
        [`station-${index}`]: {
          title: `Channel ${index + 1}`,
          thumbnails: {
            stationLogo: {
              url: `https://example.com/${index + 1}.png`
            }
          }
        }
      },
      'dt$isRadio': false
    }))
  }
  const page2 = {
    entries: [
      {
        id: 'http://data.entertainment.tv.theplatform.eu/entertainment/data/ChannelSchedule/2001',
        title: 'Channel 101',
        stations: {
          'station-101': {
            title: 'Channel 101',
            thumbnails: {
              stationLogo: {
                url: 'https://example.com/101.png'
              }
            }
          }
        },
        'dt$isRadio': false
      }
    ]
  }

  axios.get.mockImplementation((url, options) => {
    if (url === 'https://prod.dcm.telekom-dienste.de/v1/settings/web-mtv/manifest') {
      return Promise.resolve({ data: fixture.manifest })
    }

    const range = new URL(url).searchParams.get('range')
    if (range === '1-100') return Promise.resolve({ data: page1 })
    if (range === '101-200') return Promise.resolve({ data: page2 })

    return Promise.reject(new Error(`unexpected request ${url} ${JSON.stringify(options)}`))
  })

  const result = await channels()

  expect(result).toHaveLength(101)
  expect(result[0]).toMatchObject({
    site_id: '1000',
    name: 'Channel 1'
  })
  expect(result[100]).toMatchObject({
    site_id: '2001',
    name: 'Channel 101'
  })
})

it('can parse response', async () => {
  const { parser } = loadConfig()
  const result = await parser({ content: JSON.stringify(fixture.schedule), channel })
  const serialized = result.map(program => ({
    ...program,
    start: program.start.toJSON(),
    stop: program.stop.toJSON()
  }))

  expect(serialized).toMatchObject([
    {
      start: '2026-05-11T00:10:00.000Z',
      stop: '2026-05-11T01:07:00.000Z',
      title: 'FBI: Special Crime Unit',
      sub_title: 'Aufstand',
      description:
        'Eine gigantische Explosion in Brooklyn ruft das FBI auf den Plan. Hinweise deuten auf eine vorsätzliche Fremdeinwirkung hin.',
      category: ['200-Serie', 'Krimi', 'Action', 'Thriller'],
      season: 8,
      episode: 7,
      country: 'US',
      date: '2025'
    }
  ])
})

it('can handle empty guide', async () => {
  const { parser } = loadConfig()
  const result = await parser({
    channel,
    content: '{"entries":[{"id":"http://data.entertainment.tv.theplatform.eu/entertainment/data/ChannelSchedule/262270504164","listings":[]}]}'
  })

  expect(result).toMatchObject([])
})

it('can handle listings without program', async () => {
  const { parser } = loadConfig()
  const result = await parser({
    channel,
    content:
      '{"entries":[{"id":"http://data.entertainment.tv.theplatform.eu/entertainment/data/ChannelSchedule/262270504164","listings":[{"startTime":1,"endTime":2}]}]}'
  })

  expect(result).toMatchObject([])
})

it('can build a UTC schedule window', async () => {
  const { axios, url } = loadConfig()

  jest
    .spyOn(crypto, 'randomUUID')
    .mockReturnValueOnce('device-id')
    .mockReturnValueOnce('session-id')
    .mockReturnValueOnce('manifest-call-id')
    .mockReturnValueOnce('schedule-call-id')

  axios.get.mockResolvedValue({ data: fixture.manifest })

  const result = await url({
    channel,
    date
  })

  expect(new URL(result).searchParams.get('byListingTime')).toBe(
    '2026-05-11T00:00:00.000Z~2026-05-12T00:00:00.000Z'
  )
})
