const { parser, url, request } = require('./plex.tv.config.js')
const fs = require('fs')
const path = require('path')
const dayjs = require('dayjs')
const utc = require('dayjs/plugin/utc')
const customParseFormat = require('dayjs/plugin/customParseFormat')
dayjs.extend(customParseFormat)
dayjs.extend(utc)

jest.mock('axios')

const date = dayjs.utc('2023-02-05', 'YYYY-MM-DD').startOf('d')
const channel = {
  site_id: '5eea605674085f0040ddc7a6',
  xmltv_id: 'DarkMatterTV.us'
}

it('can generate valid url', () => {
  expect(url({ channel, date })).toBe(
    'https://epg.provider.plex.tv/grid?channelGridKey=5eea605674085f0040ddc7a6&date=2023-02-05'
  )
})

it('can generate valid request headers', () => {
  expect(request.headers).toMatchObject({
    'x-plex-provider-version': '5.1'
  })
})

it('can parse response', () => {
  const content = fs.readFileSync(path.resolve(__dirname, '__data__/content.json'))
  let results = parser({ content })
  results = results.map(p => {
    if (p.start) p.start = p.start.toJSON()
    if (p.stop) p.stop = p.stop.toJSON()
    return p
  })

  expect(results[0]).toMatchObject({
    title: 'The Nanny',
    subTitle: "Yetta's Lettas", 
    description: expect.stringContaining('Maxwell battles an old rival'),
    image: expect.stringContaining('http')
  })

  expect(results[1]).toMatchObject({
    title: 'The Nanny',
    subTitle: 'The Baby Shower',
    description: expect.stringContaining('A psychic predicts that Maxwell'),
    season: 6,
    episode: 20,
    image: expect.stringContaining('17nyw13tvyrd61fd9cimazndar.png')
  })
})

it('can handle empty guide', () => {
  const content = fs.readFileSync(path.resolve(__dirname, '__data__/no_content.json'))
  const results = parser({ content })

  expect(results).toMatchObject([])
})

it('can parse channel list', async () => {
  const axios = require('axios')
  axios.get.mockResolvedValue({
    data: {
      MediaContainer: {
        Channel: [
          {
            title: 'The World Poker Tour',
            gridKey: '5f6b8e7900b0950040d0f2b2',
            id: '5e20b730f2f8d5003d739db7-5f6b8e7900b0950040d0f2b2',
            thumb: 'https://provider-static.plex.tv/epg/cms/production/c40e4f88-6f5c-4f2a-8d54-e6812e25771c/wpt_logo.png',
            Media: [
              {
                Part: [
                  {
                    key: '/library/parts/5e20b730f2f8d5003d739db7-5f6b8e7900b0950040d0f2b2.m3u8'
                  }
                ]
              }
            ]
          }
        ]
      }
    }
  })

  const { channels } = require('./plex.tv.config.js')
  const results = await channels({ token: 'TEST_TOKEN' })

  expect(results[0]).toMatchObject({
    lang: 'en',
    site_id: '5f6b8e7900b0950040d0f2b2',
    name: 'The World Poker Tour',
    // logo: 'https://provider-static.plex.tv/epg/cms/production/c40e4f88-6f5c-4f2a-8d54-e6812e25771c/wpt_logo.png',
    // url: 'https://epg.provider.plex.tv/library/parts/5e20b730f2f8d5003d739db7-5f6b8e7900b0950040d0f2b2.m3u8?X-Plex-Token=TEST_TOKEN'
  })
})