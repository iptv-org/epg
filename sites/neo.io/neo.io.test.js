const { parser, url } = require('./neo.io.config.js')
const fs = require('fs')
const path = require('path')
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
  const content = fs.readFileSync(path.resolve(__dirname, '__data__/content.json'))
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
    content: fs.readFileSync(path.resolve(__dirname, '__data__/no_content.json'))
  })
  expect(result).toMatchObject([])
})
