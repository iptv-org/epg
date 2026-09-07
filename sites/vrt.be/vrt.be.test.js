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

const date = dayjs.utc('2026-08-30').startOf('d')
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
    pageId: '/vrtmax/tv-gids/vrt1/2026-08-30/'
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
    description: 'Horro-Fizz',
    season: 2,
    episode: 69,
    image: 'https://images.vrt.be/orig/2024/12/07/f9745358-8b82-4eae-a93a-f785da6305c6.jpg',
    url: [
      { system: 'episode', value: 'https://www.vrt.be/vrtmax/a-z/mr-magoo/2/mr-magoo-horro-fizz/' },
      { system: 'program', value: 'https://www.vrt.be/vrtmax/a-z/mr-magoo/' }
    ],
    start: '2026-08-30T04:00:28.000Z',
    stop: '2026-08-30T04:08:02.440Z'
  })

  // last program of the day has no successor, so its stop time comes from statusMeta ("4 min")
  const last = result[result.length - 1]
  expect(last.title).toBe('Het weer')
  expect(last.start).toBe('2026-08-30T22:35:00.000Z')
  expect(last.stop).toBe('2026-08-30T22:39:00.000Z')
})

it('gives a program still to air the page VRT names for it', async () => {
  const content = fs.readFileSync(path.resolve(__dirname, '__data__/content.json'), 'utf8')
  const result = await parser({ content, channel, date })

  // its tile links to a /vrtmax/event/ slot: the episode does not exist yet, the program does
  expect(result[17]).toMatchObject({
    title: 'VRT NWS journaal',
    url: [{ system: 'program', value: 'https://www.vrt.be/vrtmax/a-z/vrt-nws-journaal/' }]
  })
})

it('leaves a program that names no page of its own without a url', async () => {
  const content = fs.readFileSync(path.resolve(__dirname, '__data__/content.json'), 'utf8')
  const result = await parser({ content, channel, date })

  expect(result.find(p => p.title === 'Keno').url).toEqual([])
})

it('derives the program page on radio, where the tile names none', async () => {
  const content = fs.readFileSync(path.resolve(__dirname, '__data__/radio.json'), 'utf8')
  const result = await parser({
    content,
    channel: { lang: 'nl', site_id: 'radio1' },
    date: dayjs.utc('2026-08-31')
  })

  expect(result[0]).toMatchObject({
    title: 'De Ochtend',
    url: [
      {
        system: 'episode',
        value: 'https://www.vrt.be/vrtmax/luister/radio/d/de-ochtend~11-19/de-ochtend~11-38209-0/'
      },
      { system: 'program', value: 'https://www.vrt.be/vrtmax/luister/radio/d/de-ochtend~11-19/' }
    ]
  })
})

// A slot's start is written into its cursor, so these two build one rather than freeze a date: what
// is being tested is the line between started and not, not any particular day.
const cursorAt = ms => `o%0|n%4|epg-entry|o#349#0O8#0d#3${ms}#0#0#3%`

const trackedTile = (extra = {}) => ({
  title: 'Bumba',
  statusMeta: [{ value: '6 min' }],
  trackingData: { data: '{"$leti":"Bumba","$tapu":"/vrtmax/a-z/bumba/2022/bumba-s2022a12/"}' },
  ...extra
})

const guideWith = (start, extra) =>
  JSON.stringify({
    data: {
      page: {
        previous: {
          paginatedItems: {
            edges: [
              { cursor: cursorAt(start), node: trackedTile(extra) },
              { cursor: cursorAt(start + 600000), node: { title: 'Timbalo', statusMeta: [{ value: '10 min' }] } }
            ]
          }
        },
        current: null,
        next: { paginatedItems: { edges: [] } }
      }
    }
  })

it('fills an aired slot that names no episode of its own from its tracking data', async () => {
  // Bumba on 2026-09-07: the tile carried an event action before it aired and none at all after,
  // while the episode page it names appeared a minute into the broadcast. 5 of 5 such slots that
  // day pointed at a page that really exists.
  const result = await parser({ content: guideWith(Date.now() - 3600000), channel, date })

  expect(result.find(p => p.title === 'Bumba').url).toEqual([
    { system: 'episode', value: 'https://www.vrt.be/vrtmax/a-z/bumba/2022/bumba-s2022a12/' }
  ])
})

it('holds the episode back until the slot has started, keeping the program page', async () => {
  const content = guideWith(Date.now() + 3600000, {
    actionItems: [{ action: { link: '/vrtmax/a-z/bumba/' } }]
  })
  const result = await parser({ content, channel, date })

  expect(result.find(p => p.title === 'Bumba').url).toEqual([
    { system: 'program', value: 'https://www.vrt.be/vrtmax/a-z/bumba/' }
  ])
})

it('reads the airing radio program off its tracking data', async () => {
  const content = JSON.stringify({
    data: {
      page: {
        previous: {
          paginatedItems: {
            edges: [{ cursor: 'o%0|n%5|n%0|o#349#031#0d#31788768000000#0#0#3%', node: { title: 'Iedereen Klassiek', statusMeta: [{ value: '180 min' }] } }]
          }
        },
        current: { objectId: 'o%1|123|2026-09-07%' },
        next: { paginatedItems: { edges: [] } }
      }
    }
  })
  // the airing radio tile links to the livestream and has no actionItems; only $tapu names the page
  axios.post.mockResolvedValueOnce({
    data: {
      data: {
        list: {
          paginatedItems: {
            edges: [
              {
                cursor: 'o%0|n%5|n%0|o#349#031#0d#31788775200000#0#0#3%',
                node: {
                  title: 'Music Matters',
                  statusMeta: [{ value: '120 min' }],
                  action: { link: '/vrtmax/livestream/audio/klara/' },
                  actionItems: [],
                  trackingData: {
                    data: '{"$leti":"Music Matters","$tapu":"/vrtmax/luister/radio/m/music-matters~31-95/music-matters~31-32299-0/"}'
                  }
                }
              }
            ]
          }
        }
      }
    }
  })

  const result = await parser({
    content,
    channel: { lang: 'nl', site_id: 'klara' },
    date: dayjs.utc('2026-09-07')
  })

  expect(result.find(p => p.title === 'Music Matters').url).toEqual([
    {
      system: 'episode',
      value: 'https://www.vrt.be/vrtmax/luister/radio/m/music-matters~31-95/music-matters~31-32299-0/'
    },
    {
      system: 'program',
      value: 'https://www.vrt.be/vrtmax/luister/radio/m/music-matters~31-95/'
    }
  ])
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
    'https://www.vrt.be/vrtnu-api/graphql/v1',
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

  expect(result[19].url).toEqual([])
})

it('drops an event url instead of storing it', async () => {
  const content = fs.readFileSync(path.resolve(__dirname, '__data__/content.json'), 'utf8')
  const result = await parser({ content, channel, date })

  // fourteen of the thirty-four tiles link to an event slot, and none of those links is kept
  const links = result.flatMap(p => p.url.map(url => url.value))
  expect(links.every(link => link.startsWith('https://www.vrt.be/vrtmax/a-z/'))).toBe(true)
})

it('reads the airing television program off its tracking data', async () => {
  const content = JSON.stringify({
    data: {
      page: {
        previous: {
          paginatedItems: {
            edges: [{ cursor: 'o%0|n%4|epg-entry|o#349#0O8#0d#31786531200000#0#0#3%', node: { title: 'Before', statusMeta: [{ value: '5 min' }] } }]
          }
        },
        current: { objectId: 'o%1|123|2026-08-12%' },
        next: { paginatedItems: { edges: [] } }
      }
    }
  })
  // the airing tile links to the livestream; the episode it stands for is only in $tapu, and the
  // season in the path ("2025-2026") is not the one a search of the current season would look in
  axios.post.mockResolvedValueOnce({
    data: {
      data: {
        list: {
          paginatedItems: {
            edges: [
              {
                cursor: 'o%0|n%4|epg-entry|o#349#0O8#0d#31786531500000#0#0#3%',
                node: {
                  title: 'Blokken',
                  statusMeta: [{ value: '30 min' }],
                  action: { link: '/vrtmax/livestream/video/vrt1/' },
                  actionItems: [{ action: { link: '/vrtmax/a-z/blokken/' } }],
                  trackingData: {
                    data: '{"$leti":"Blokken","$tapu":"/vrtmax/a-z/blokken/2025-2026/blokken-d20260323/"}'
                  }
                }
              }
            ]
          }
        }
      }
    }
  })

  const result = await parser({ content, channel, date: dayjs.utc('2026-08-12') })

  // the snapshot is the only call: no program page is opened and no episode list is paged through
  expect(axios.post).toHaveBeenCalledTimes(1)
  expect(result.find(p => p.title === 'Blokken').url).toEqual([
    { system: 'episode', value: 'https://www.vrt.be/vrtmax/a-z/blokken/2025-2026/blokken-d20260323/' },
    { system: 'program', value: 'https://www.vrt.be/vrtmax/a-z/blokken/' }
  ])
})

it('keeps an airing slot on the livestream out of the guide', async () => {
  const content = JSON.stringify({
    data: {
      page: {
        previous: {
          paginatedItems: {
            edges: [{ cursor: 'o%0|n%4|epg-entry|o#349#0O8#0d#31786531200000#0#0#3%', node: { title: 'Before', statusMeta: [{ value: '5 min' }] } }]
          }
        },
        current: { objectId: 'o%1|123|2026-08-12%' },
        next: { paginatedItems: { edges: [] } }
      }
    }
  })
  // $tapu points back at the livestream rather than at an episode page
  axios.post.mockResolvedValueOnce({
    data: {
      data: {
        list: {
          paginatedItems: {
            edges: [
              {
                cursor: 'o%0|n%4|epg-entry|o#349#0O8#0d#31786531500000#0#0#3%',
                node: {
                  title: 'Het journaal',
                  statusMeta: [{ value: '30 min' }],
                  action: { link: '/vrtmax/livestream/video/vrt1/' },
                  actionItems: [{ action: { link: '/vrtmax/a-z/het-journaal/' } }],
                  trackingData: { data: '{"$tapu":"/vrtmax/livestream/video/vrt1/"}' }
                }
              }
            ]
          }
        }
      }
    }
  })

  const result = await parser({ content, channel, date: dayjs.utc('2026-08-12') })

  expect(result.find(p => p.title === 'Het journaal').url).toEqual([
    { system: 'program', value: 'https://www.vrt.be/vrtmax/a-z/het-journaal/' }
  ])
})

it('keeps the airing program url when the tile names no episode', async () => {
  const content = JSON.stringify({
    data: {
      page: {
        previous: {
          paginatedItems: {
            edges: [{ cursor: 'o%0|n%4|epg-entry|o#349#0O8#0d#31786531200000#0#0#3%', node: { title: 'Before' } }]
          }
        },
        current: { objectId: 'o%1|123|2026-08-12%' },
        next: { paginatedItems: { edges: [] } }
      }
    }
  })

  // the airing tile carries no tracking data at all, so only its program page is known
  axios.post.mockResolvedValueOnce({
    data: {
      data: {
        list: {
          paginatedItems: {
            edges: [
              {
                cursor: 'o%0|n%4|epg-entry|o#349#0O8#0d#31786531500000#0#0#3%',
                node: {
                  title: 'FC De Kampioenen',
                  statusMeta: [{ value: '30 min' }],
                  action: { link: '/vrtmax/livestream/video/vrt1/' },
                  actionItems: [{ action: { link: '/vrtmax/a-z/fc-de-kampioenen/' } }]
                }
              }
            ]
          }
        }
      }
    }
  })

  const result = await parser({ content, channel, date: dayjs.utc('2026-08-12') })

  expect(result.find(p => p.title === 'FC De Kampioenen').url).toEqual([
    { system: 'program', value: 'https://www.vrt.be/vrtmax/a-z/fc-de-kampioenen/' }
  ])
})

it('can parse the airing program as last item of the day', async () => {
  const content = JSON.stringify({
    data: {
      page: {
        previous: {
          paginatedItems: {
            edges: [{ cursor: 'o%0|n%4|epg-entry|o#349#0O8#0d#31786569000000#0#0#3%', node: { title: 'Test' } }]
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
                cursor: 'o%0|n%4|epg-entry|o#349#0O8#0d#31786571400000#0#0#3%',
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
                cursor: 'o%0|n%4|epg-entry|o#349#0O8#0d#31786420800000#0#0#3%',
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
                cursor: 'o%0|n%4|epg-entry|o#349#01H#0d#31786420800000#0#0#3%',
                node: { title: 'Test', description: null, statusMeta: [{ value: '30 min' }], image: null, action: null }
              },
              {
                cursor: 'o%0|n%4|epg-entry|o#349#01H#0d#31786422600000#0#0#3%',
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
            edges: [{ cursor: 'o%0|n%4|epg-entry|o#349#0O8#0d#31786420800000#0#0#3%', node: tile('Page 1') }],
            pageInfo: { hasNextPage: true, endCursor: 'o%0|n%4|epg-entry|o#349#0O8#0d#31786420800000#0#0#3%' }
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
                { cursor: 'o%0|n%4|epg-entry|o#349#0O8#0d#31786422600000#0#0#3%', node: tile('Page 2', [{ value: '15 min' }]) }
              ],
              pageInfo: { hasNextPage: false, endCursor: null }
            }
          }
        }
      }
    }
  })

  // its own date: the cursors below carry 2026-08-11, and the page id has to name the same day
  const result = await parser({ content, channel, date: dayjs.utc('2026-08-11') })

  expect(axios.post).toHaveBeenCalledWith(
    'https://www.vrt.be/vrtnu-api/graphql/public/v1',
    expect.objectContaining({
      variables: {
        pageId: '/vrtmax/tv-gids/vrt1/2026-08-11/',
        nextAfter: 'o%0|n%4|epg-entry|o#349#0O8#0d#31786420800000#0#0#3%',
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

// The epoch sits behind a "3" number tag. Reading thirteen digits from the left of that swallows the
// tag and drops the last digit, which lands in 2070 and squeezes ten days of guide onto one.
it('does not read the number tag as part of the start time', async () => {
  const content = JSON.stringify({
    data: {
      page: {
        previous: { paginatedItems: { edges: [] } },
        next: {
          paginatedItems: {
            edges: [
              {
                cursor: 'o%0|n%5|epg-entry|o#349#044#0d#31786982400000#0#0#3%',
                node: { title: 'De Tijdloze', statusMeta: [{ value: '60 min' }] }
              }
            ]
          }
        }
      }
    }
  })

  const result = await parser({ content, channel, date })

  expect(result[0].start.toJSON()).toBe('2026-08-17T16:00:00.000Z')
  expect(result[0].stop.toJSON()).toBe('2026-08-17T17:00:00.000Z')
})

// The API moved to "#"-separated cursors in the summer of 2026; the older shape carries the same
// epoch and channel code, only in other places.
it('still understands the older cursor format', async () => {
  const content = JSON.stringify({
    data: {
      page: {
        previous: {
          paginatedItems: {
            edges: [
              {
                cursor: 'o%49|O8|d%1786420800000||%',
                node: { title: 'Test', statusMeta: [{ value: '30 min' }] }
              }
            ]
          }
        },
        current: { objectId: 'o%1|123|2026-08-11%' },
        next: { paginatedItems: { edges: [] } }
      }
    }
  })
  axios.post.mockResolvedValueOnce({ data: { data: { list: null } } })

  const result = await parser({ content, channel, date })

  expect(axios.post).toHaveBeenCalledWith(
    'https://www.vrt.be/vrtnu-api/graphql/v1',
    expect.objectContaining({ variables: { listId: '$byUzMXxzbmFwc2hvdHxPOHx8fHwl' } }),
    expect.anything()
  )
  expect(result[0].start.toJSON()).toBe('2026-08-11T04:00:00.000Z')
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
