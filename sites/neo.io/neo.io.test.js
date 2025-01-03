const { parser, url } = require('./neo.io.config.js')
const dayjs = require('dayjs')
const utc = require('dayjs/plugin/utc')
const customParseFormat = require('dayjs/plugin/customParseFormat')
dayjs.extend(customParseFormat)
dayjs.extend(utc)

const date = dayjs.utc('2024-12-26', 'YYYY-MM-DD').startOf('day')
const channel = {
  site_id: 'tv-slo-1',
  xmltv_id: 'TVSLO1.si'
}

it('can generate valid url', () => {
  expect(url({ date, channel })).toBe(
    'https://stargate.telekom.si/api/titan.tv.WebEpg/GetWebEpgData'
  )
})

it('can parse response', () => {
  const content = `
  {
    "shows": [
        {
            "title": "Napovedujemo",
            "show_start": 1735185900,
            "show_end": 1735192200,
            "timestamp": "5:05 - 6:50",
            "show_id": "CUP_IECOM_SLO1_10004660",
            "thumbnail": "https://ngimg.siol.tv/sioltv/mtcmsprod/52/0/0/5200d01a-fe5f-487e-835a-274e77227a6b.jpg",
            "is_adult": false,
            "friendly_id": "napovedujemo_db48",
            "pg": "",
            "genres": [
                "napovednik"
            ],
            "year": 0,
            "summary": "Vabilo k ogledu naših oddaj.",
            "categories": "Ostalo",
            "stb_only": false,
            "is_live": false,
            "original_title": "Napovedujemo"
        },
        {
            "title": "S0E0 - Hrabri zajčki: Prvi sneg",
            "show_start": 1735192200,
            "show_end": 1735192800,
            "timestamp": "6:50 - 7:00",
            "show_id": "CUP_IECOM_SLO1_79637910",
            "thumbnail": "https://ngimg.siol.tv/sioltv/mtcmsprod/d6/4/5/d6456f4a-4f0a-4825-90c1-1749abd59688.jpg",
            "is_adult": false,
            "friendly_id": "hrabri_zajcki_prvi_sneg_1619",
            "pg": "",
            "genres": [
                "risanka"
            ],
            "year": 2020,
            "summary": "Hrabri zajčki so prispeli v borov gozd in izkusili prvi sneg. Bob in Bu še nikoli nista videla snega. Mami kuha korenčkov kakav, Bu in Bob pa kmalu spoznata novega prijatelja, losa Danija.",
            "categories": "Otroški/Mladinski",
            "stb_only": false,
            "is_live": false,
            "original_title": "S0E0 - Brave Bunnies"
        },
        {
            "title": "Dobro jutro",
            "show_start": 1735192800,
            "show_end": 1735203900,
            "timestamp": "7:00 - 10:05",
            "show_id": "CUP_IECOM_SLO1_79637911",
            "thumbnail": "https://ngimg.siol.tv/sioltv/mtcmsprod/e1/2/d/e12d8eb4-693a-43d3-89d4-fd96dade9f0f.jpg",
            "is_adult": false,
            "friendly_id": "dobro_jutro_2f10",
            "pg": "",
            "genres": [
                "zabavna oddaja"
            ],
            "year": 2024,
            "summary": "Oddaja Dobro jutro poleg informativnih in zabavnih vsebin podaja koristne nasvete o najrazličnejših tematikah iz vsakdanjega življenja.",
            "categories": "Razvedrilni program",
            "stb_only": false,
            "is_live": false,
            "original_title": "Dobro jutro"
        }
    ]
  }`

  const result = parser({ content, channel })

  expect(result).toMatchObject([
    {
      title: 'Napovedujemo',
      description: 'Vabilo k ogledu naših oddaj.',
      start: '2024-12-26T04:05:00.000Z',
      stop: '2024-12-26T05:50:00.000Z',
      thumbnail:
        'https://ngimg.siol.tv/sioltv/mtcmsprod/52/0/0/5200d01a-fe5f-487e-835a-274e77227a6b.jpg'
    },
    {
      title: 'S0E0 - Hrabri zajčki: Prvi sneg',
      description:
        'Hrabri zajčki so prispeli v borov gozd in izkusili prvi sneg. Bob in Bu še nikoli nista videla snega. Mami kuha korenčkov kakav, Bu in Bob pa kmalu spoznata novega prijatelja, losa Danija.',
      start: '2024-12-26T05:50:00.000Z',
      stop: '2024-12-26T06:00:00.000Z',
      thumbnail:
        'https://ngimg.siol.tv/sioltv/mtcmsprod/d6/4/5/d6456f4a-4f0a-4825-90c1-1749abd59688.jpg'
    },
    {
      title: 'Dobro jutro',
      description:
        'Oddaja Dobro jutro poleg informativnih in zabavnih vsebin podaja koristne nasvete o najrazličnejših tematikah iz vsakdanjega življenja.',
      start: '2024-12-26T06:00:00.000Z',
      stop: '2024-12-26T09:05:00.000Z',
      thumbnail:
        'https://ngimg.siol.tv/sioltv/mtcmsprod/e1/2/d/e12d8eb4-693a-43d3-89d4-fd96dade9f0f.jpg'
    }
  ])
})

it('can handle empty guide', () => {
  const result = parser({
    content: '{"shows":[]}'
  })
  expect(result).toMatchObject([])
})
