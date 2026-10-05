const { parser, url } = require('./hoy.tv.config.js')
const fs = require('fs')
const path = require('path')
const dayjs = require('dayjs')
const utc = require('dayjs/plugin/utc')

dayjs.extend(utc)

jest.mock('axios')

const date = dayjs.utc('2024-09-13', 'YYYY-MM-DD').startOf('d')
const channel = {
  site_id: '76',
  xmltv_id: 'HOYIBC.hk',
  lang: 'zh'
}

it('can generate valid url', () => {
  expect(url({ channel, date })).toBe('https://epg-file.hoy.tv/hoy/OTT7620240913.xml')
})

it('can parse response', () => {
  const content = fs.readFileSync(path.resolve(__dirname, '__data__/content.xml'), 'utf8')
  
  const result = parser({ content, channel, date }).map(p => {
    p.start = p.start.toJSON()
    p.stop = p.stop.toJSON()
    return p
  })

  expect(result).toMatchObject([
    {
      start: '2024-09-13T03:30:00.000Z',
      stop: '2024-09-13T04:30:00.000Z',
      title: '點講都係一家人[PG]',
      sub_title: '第46集'
    },
    {
      start: '2024-09-13T04:30:00.000Z',
      stop: '2024-09-13T05:30:00.000Z',
      title: '麝香之路',
      description:
        'Ep. 2 .The Secret of disappeared kingdom.shows the mysterious disappearance of the ancient Tibetan kingdom which gained world'
    }
  ])
})
