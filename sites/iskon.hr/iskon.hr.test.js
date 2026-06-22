const { parser, url } = require('./iskon.hr.config.js')
const fs = require('fs')
const path = require('path')
const dayjs = require('dayjs')
const utc = require('dayjs/plugin/utc')
const customParseFormat = require('dayjs/plugin/customParseFormat')
dayjs.extend(customParseFormat)
dayjs.extend(utc)

const date = dayjs.utc('2026-06-22', 'YYYY-MM-DD').startOf('d')
const channel = {
  site_id: '1',
  xmltv_id: 'HRT1.hr'
}

it('can generate valid url', () => {
  expect(url({ date })).toBe('https://iskon.hr/api/epg/programs_2026_06_22.json')
})

it('can parse response', () => {
  // The day file holds every channel; the parser keeps only this channel's rows (channelUuid 1),
  // so the channelUuid-2 programme is dropped.
  const content = fs.readFileSync(path.resolve(__dirname, '__data__/content.html'), 'utf8')
  const result = parser({ content, channel })

  expect(result).toMatchObject([
    {
      title: 'Vijesti',
      description: 'Dnevne vijesti.',
      categories: ['informativni'],
      date: '2026',
      image: 'https://iskon.hr/public/epg/images/100.jpg',
      start: '2026-06-22T06:00:00+0200',
      stop: '2026-06-22T06:30:00+0200'
    },
    {
      title: 'Film',
      description: null,
      categories: [],
      date: null,
      image: null,
      start: '2026-06-22T06:30:00+0200',
      stop: '2026-06-22T08:00:00+0200'
    }
  ])
  expect(result.length).toBe(2)
})

it('can handle empty guide', () => {
  const result = parser({
    date,
    channel,
    content: fs.readFileSync(path.resolve(__dirname, '__data__/no_content.html'), 'utf8')
  })
  expect(result).toMatchObject([])
})
