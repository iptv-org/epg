const { parser, url, request } = require('./vrt.be.config.js')
const axios = require('axios')
const fs = require('fs')
const path = require('path')
const dayjs = require('dayjs')
const utc = require('dayjs/plugin/utc')
dayjs.extend(utc)

jest.mock('axios')

const channelsContent = fs.readFileSync(path.resolve(__dirname, '__data__/channels.json'), 'utf8')
axios.post.mockResolvedValue({ data: JSON.parse(channelsContent) })

beforeEach(() => {
  jest.clearAllMocks()
})

const date = dayjs.utc('2026-08-11').startOf('d')
const channel = {
  lang: 'nl',
  site_id: 'vrt1'
}

it('can generate valid url', () => {
  expect(url).toBe('https://www.vrt.be/vrtnu-api/graphql/public/v1')
})

it('can generate valid request method', () => {
  expect(request.method).toBe('POST')
})

it('can generate valid request headers', () => {
  expect(request.headers).toMatchObject({ 'content-type': 'application/json', 'x-vrt-client-name': 'WEB' })
})

it('can generate valid request data', () => {
  const data = request.data({ channel, date })
  expect(data.variables).toMatchObject({
    pageId: '/vrtmax/tv-gids/vrt1/2026-08-11/'
  })
  expect(typeof data.query).toBe('string')
})

it('can parse response', async () => {
  const content = fs.readFileSync(path.resolve(__dirname, '__data__/content.json'), 'utf8')
  const result = (await parser({ content, channel, date })).map(p => {
    p.start = p.start.toJSON()
    p.stop = p.stop.toJSON()
    return p
  })

  expect(result[0]).toMatchObject({
    title: 'Mr. Magoo',
    description: 'Slaap zacht!',
    season: 2,
    episode: 50,
    image: 'https://images.vrt.be/orig/2024/12/07/cd61594f-3ba6-46c3-8133-ab4673274028.jpg',
    url: 'https://www.vrt.be/vrtmax/a-z/mr-magoo/2/mr-magoo-slaap-zacht/',
    start: '2026-08-11T04:00:00.000Z',
    stop: '2026-08-11T04:05:00.000Z'
  })

  // last program of the day has no successor, so its stop time comes from statusMeta ("4 min")
  const last = result[result.length - 1]
  expect(last.title).toBe('Het weer')
  expect(last.start).toBe('2026-08-11T21:40:00.000Z')
  expect(last.stop).toBe('2026-08-11T21:44:00.000Z')
})

it('can parse program without action', async () => {
  const content = fs.readFileSync(path.resolve(__dirname, '__data__/content.json'), 'utf8')
  const result = await parser({ content, channel, date })

  expect(result.find(p => p.title === 'Radio 2 aan Zee').url).toBe(null)
})

it('can parse the currently airing program', async () => {
  const content = fs.readFileSync(path.resolve(__dirname, '__data__/current.json'), 'utf8')
  const snapshot = fs.readFileSync(path.resolve(__dirname, '__data__/snapshot.json'), 'utf8')
  axios.post.mockResolvedValueOnce({ data: JSON.parse(snapshot) })

  const result = (await parser({ content, channel, date: dayjs.utc('2026-08-12') })).map(p => {
    p.start = p.start.toJSON()
    p.stop = p.stop.toJSON()
    return p
  })

  expect(axios.post).toHaveBeenCalledWith(
    'https://www.vrt.be/vrtnu-api/graphql/public/v1',
    expect.objectContaining({ variables: { listId: '$byUzMXxzbmFwc2hvdHxPOHx8fHwl' } }),
    expect.anything()
  )

  expect(result[18]).toMatchObject({
    title: 'Sporza: zwemmen',
    stop: '2026-08-12T09:35:00.000Z'
  })
  expect(result[19]).toMatchObject({
    title: 'Sporza: EK atletiek',
    start: '2026-08-12T09:35:00.000Z',
    stop: '2026-08-12T11:00:00.000Z'
  })
  expect(result[20]).toMatchObject({
    title: 'VRT NWS journaal',
    start: '2026-08-12T11:00:00.000Z'
  })
})

it('leaves the airing program without a url rather than linking to the livestream', async () => {
  const content = fs.readFileSync(path.resolve(__dirname, '__data__/current.json'), 'utf8')
  const snapshot = fs.readFileSync(path.resolve(__dirname, '__data__/snapshot.json'), 'utf8')
  axios.post.mockResolvedValueOnce({ data: JSON.parse(snapshot) })

  const result = await parser({ content, channel, date: dayjs.utc('2026-08-12') })

  expect(result[19].url).toBe(null)
  expect(result[20].url).toBe(
    'https://www.vrt.be/vrtmax/event/byU0OXxPOHxkJTE3ODY1MzI0MDAwMDB8fCU=/'
  )
})

it('can parse the airing program as last item of the day', async () => {
  const content = JSON.stringify({
    data: {
      page: {
        previous: {
          paginatedItems: {
            edges: [{ cursor: 'o%49|O8|d%1786569000000||%', node: { title: 'Test' } }]
          }
        },
        current: { objectId: 'o%1|123|2026-08-11%' },
        next: { paginatedItems: { edges: [] } }
      }
    }
  })
  axios.post.mockResolvedValueOnce({
    data: {
      data: {
        list: {
          paginatedItems: {
            edges: [
              {
                cursor: 'o%49|O8|d%1786571400000||%',
                node: { title: 'Test 2', statusMeta: [{ value: '20 min' }] }
              }
            ]
          }
        }
      }
    }
  })

  const result = (await parser({ content, channel, date })).map(p => {
    p.start = p.start.toJSON()
    p.stop = p.stop.toJSON()
    return p
  })

  expect(result[0]).toMatchObject({ title: 'Test', stop: '2026-08-12T21:50:00.000Z' })
  expect(result[1]).toMatchObject({
    title: 'Test 2',
    start: '2026-08-12T21:50:00.000Z',
    stop: '2026-08-12T22:10:00.000Z'
  })
})

it('does not look for an airing program on a day that has none', async () => {
  const content = JSON.stringify({
    data: {
      page: {
        previous: { paginatedItems: { edges: [] } },
        next: {
          paginatedItems: {
            edges: [
              {
                cursor: 'o%49|O8|d%1786420800000||%',
                node: { title: 'Test', statusMeta: [{ value: '30 min' }] }
              }
            ]
          }
        }
      }
    }
  })

  const result = await parser({ content, channel, date })

  expect(result.map(p => p.title)).toEqual(['Test'])
  expect(axios.post).not.toHaveBeenCalled()
})

it('can parse cursor with any channel prefix', async () => {
  const content = JSON.stringify({
    data: {
      page: {
        previous: { paginatedItems: { edges: [] } },
        next: {
          paginatedItems: {
            edges: [
              {
                cursor: 'o%49|1H|d%1786420800000||%',
                node: { title: 'Test', description: null, statusMeta: [{ value: '30 min' }], image: null, action: null }
              },
              {
                cursor: 'o%49|1H|d%1786422600000||%',
                node: { title: 'Test 2', description: null, statusMeta: null, image: null, action: null }
              }
            ]
          }
        }
      }
    }
  })
  const result = (await parser({ content, channel, date })).map(p => {
    p.start = p.start.toJSON()
    p.stop = p.stop.toJSON()
    return p
  })
  expect(result[0]).toMatchObject({
    title: 'Test',
    start: '2026-08-11T04:00:00.000Z',
    stop: '2026-08-11T04:30:00.000Z'
  })
})

it('can load additional pages', async () => {
  const tile = (title, statusMeta = null) => ({
    title,
    description: null,
    statusMeta,
    image: null,
    action: null
  })
  const content = JSON.stringify({
    data: {
      page: {
        previous: { paginatedItems: { edges: [], pageInfo: { hasNextPage: false, endCursor: null } } },
        next: {
          paginatedItems: {
            edges: [{ cursor: 'o%49|O8|d%1786420800000||%', node: tile('Page 1') }],
            pageInfo: { hasNextPage: true, endCursor: 'o%49|O8|d%1786420800000||%' }
          }
        }
      }
    }
  })

  axios.post.mockResolvedValueOnce({
    data: {
      data: {
        page: {
          previous: { paginatedItems: { edges: [], pageInfo: { hasNextPage: false, endCursor: null } } },
          next: {
            paginatedItems: {
              edges: [
                { cursor: 'o%49|O8|d%1786422600000||%', node: tile('Page 2', [{ value: '15 min' }]) }
              ],
              pageInfo: { hasNextPage: false, endCursor: null }
            }
          }
        }
      }
    }
  })

  const result = await parser({ content, channel, date })

  expect(axios.post).toHaveBeenCalledWith(
    'https://www.vrt.be/vrtnu-api/graphql/public/v1',
    expect.objectContaining({
      variables: {
        pageId: '/vrtmax/tv-gids/vrt1/2026-08-11/',
        nextAfter: 'o%49|O8|d%1786420800000||%',
        skipPrevious: true,
        skipNext: false,
        skipCurrent: true
      }
    }),
    expect.anything()
  )
  expect(result.map(p => p.title)).toEqual(['Page 1', 'Page 2'])
  expect(result[0].stop.toJSON()).toBe('2026-08-11T04:30:00.000Z')
  expect(result[1].stop.toJSON()).toBe('2026-08-11T04:45:00.000Z')
})

it('can handle empty guide', async () => {
  const result = await parser({ content: '', channel, date })
  expect(result).toMatchObject([])
})

it('can load channels', async () => {
  const result = await require('./vrt.be.config.js').channels()
  expect(result[0]).toMatchObject({
    lang: 'nl',
    site_id: 'vrt1',
    name: 'VRT 1'
  })
  expect(result.length).toBe(10)
})
