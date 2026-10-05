const { parser, url } = require('./allente.fi.config.js')
const fs = require('fs')
const path = require('path')
const dayjs = require('dayjs')

const date = dayjs('2026-06-28').startOf('d')
const channel = {
  site_id: '20001'
}

it('can generate valid url', () => {
  expect(url({ date })).toBe('https://www.allente.fi/api/epg/refetch-epg-data?Start=2026-06-28')
})

it('can parse response', () => {
  const content = fs.readFileSync(path.resolve(__dirname, '__data__/content.json'))
  const result = parser({ content, channel })
    .map(p => {
      p.start = p.start.toJSON()
      p.stop = p.stop.toJSON()
      return p
    })

  expect(result.length).toBe(26)
  expect(result[2]).toMatchObject({
    start: '2026-06-28T03:30:00.000Z',
    stop: '2026-06-28T04:00:00.000Z',
    title: 'Trucks!',
    description:
      'The hosts present viewers with all of the latest trends and models for trucks while also demonstrating a series of how-to projects.',
    category: ['Elämäntapa', 'Antiikki'],
    image:
      'https://allente-imgmgr.akamaized.net/11823019554723227163.jpg?im=Resize,width=600,%20height=338',
    season: 19,
    episode: 6,
    year: '2026'
  })
  expect(result[25]).toMatchObject({
    start: '2026-06-28T23:30:00.000Z',
    stop: '2026-06-29T03:00:00.000Z',
    title: 'Airing Break',
    category: ['Sekalaiset'],
    season: null,
    episode: null
  })
})

it('can handle empty guide', () => {
  const result = parser({
    date,
    channel,
    content: fs.readFileSync(path.resolve(__dirname, '__data__/no_content.json'))
  })
  expect(result).toMatchObject([])
})
