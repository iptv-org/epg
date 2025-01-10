const { parser, url } = require('./ipko.tv.config.js')
const dayjs = require('dayjs')
const utc = require('dayjs/plugin/utc')
const customParseFormat = require('dayjs/plugin/customParseFormat')
dayjs.extend(customParseFormat)
dayjs.extend(utc)

const date = dayjs.utc('2024-12-24', 'YYYY-MM-DD').startOf('day')
const channel = {
  site_id: 'ipko-promo',
  xmltv_id: 'IPKOPROMO'
}

it('can generate valid url', () => {
  expect(url({ date, channel })).toBe('https://stargate.ipko.tv/api/titan.tv.WebEpg/GetWebEpgData')
})

it('can parse response', () => {
  const content = `
  {
    "shows": [
      {
        "title": "IPKO Promo",
        "show_start": 1735012800,
        "show_end": 1735020000,
        "timestamp": "5:00 - 7:00",
        "show_id": "EPG_TvProfil_IPKOPROMO_296105567",
        "thumbnail": "https://vimg.ipko.tv/mtcms/18/2/1/1821cc68-a9bf-4733-b1af-9a5d80163b78.jpg",
        "is_adult": false,
        "friendly_id": "ipko_promo_4cf3",
        "pg": "",
        "genres": [],
        "year": 0,
        "summary": "",
        "categories": "Other",
        "stb_only": false,
        "is_live": false,
        "original_title": "IPKO Promo"
      },
      {
        "title": "IPKO Promo",
        "show_start": 1735020000,
        "show_end": 1735027200,
        "timestamp": "7:00 - 9:00",
        "show_id": "EPG_TvProfil_IPKOPROMO_296105568",
        "thumbnail": "https://vimg.ipko.tv/mtcms/18/2/1/1821cc68-a9bf-4733-b1af-9a5d80163b78.jpg",
        "is_adult": false,
        "friendly_id": "ipko_promo_416b",
        "pg": "",
        "genres": [],
        "year": 0,
        "summary": "",
        "categories": "Other",
        "stb_only": false,
        "is_live": false,
        "original_title": "IPKO Promo"
      },
      {
        "title": "IPKO Promo",
        "show_start": 1735027200,
        "show_end": 1735034400,
        "timestamp": "9:00 - 11:00",
        "show_id": "EPG_TvProfil_IPKOPROMO_296105569",
        "thumbnail": "https://vimg.ipko.tv/mtcms/18/2/1/1821cc68-a9bf-4733-b1af-9a5d80163b78.jpg",
        "is_adult": false,
        "friendly_id": "ipko_promo_2e23",
        "pg": "",
        "genres": [],
        "year": 0,
        "summary": "",
        "categories": "Other",
        "stb_only": false,
        "is_live": false,
        "original_title": "IPKO Promo"
      }
    ]
  }`

  const result = parser({ content, channel })

  expect(result).toMatchObject([
    {
      title: 'IPKO Promo',
      description: 'No description available',
      start: '2024-12-24T04:00:00.000Z',
      stop: '2024-12-24T06:00:00.000Z',
      thumbnail: 'https://vimg.ipko.tv/mtcms/18/2/1/1821cc68-a9bf-4733-b1af-9a5d80163b78.jpg'
    },
    {
      title: 'IPKO Promo',
      description: 'No description available',
      start: '2024-12-24T06:00:00.000Z',
      stop: '2024-12-24T08:00:00.000Z',
      thumbnail: 'https://vimg.ipko.tv/mtcms/18/2/1/1821cc68-a9bf-4733-b1af-9a5d80163b78.jpg'
    },
    {
      title: 'IPKO Promo',
      description: 'No description available',
      start: '2024-12-24T08:00:00.000Z',
      stop: '2024-12-24T10:00:00.000Z',
      thumbnail: 'https://vimg.ipko.tv/mtcms/18/2/1/1821cc68-a9bf-4733-b1af-9a5d80163b78.jpg'
    }
  ])
})

it('can handle empty guide', () => {
  const result = parser({
    content: '{"shows":[]}'
  })
  expect(result).toMatchObject([])
})
