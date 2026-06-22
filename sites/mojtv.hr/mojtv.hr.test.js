const { parser, url } = require('./mojtv.hr.config.js')
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
  xmltv_id: 'HTV1.hr'
}

it('can generate valid url', () => {
  expect(url({ channel, date })).toBe('https://mojtv.hr/kanal/tv-program/1/x/2026-06-22.aspx')
})

it('can parse response', () => {
  const content = fs.readFileSync(path.resolve(__dirname, '__data__/content.html'), 'utf8')
  const result = parser({ content, date }).map(p => {
    p.start = p.start.toJSON()
    p.stop = p.stop.toJSON()
    return p
  })

  // Vijesti appears in both lists (deduped to one); the next-day spillover row is dropped;
  // both the strong.title and the plain-strong/strong.desc formats parse.
  expect(result).toMatchObject([
    {
      start: '2026-06-22T04:25:00.000Z',
      stop: '2026-06-22T04:45:00.000Z',
      title: 'TV kalendar',
      description: 'Dokumentarna emisija.'
    },
    {
      start: '2026-06-22T04:45:00.000Z',
      stop: '2026-06-22T05:00:00.000Z',
      title: 'Vijesti',
      description: 'Pregled vijesti.'
    },
    {
      start: '2026-06-22T05:00:00.000Z',
      stop: '2026-06-22T05:30:00.000Z',
      title: 'Dobro jutro',
      description: 'Jutarnji program.'
    }
  ])
  expect(result.length).toBe(3)
})

it('can handle empty guide', () => {
  const result = parser({
    date,
    channel,
    content: fs.readFileSync(path.resolve(__dirname, '__data__/no_content.html'), 'utf8')
  })
  expect(result).toMatchObject([])
})
