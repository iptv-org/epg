const { parser, url } = require('./abc.net.au.config.js')
const fs = require('fs')
const path = require('path')
const dayjs = require('dayjs')
const utc = require('dayjs/plugin/utc')
dayjs.extend(utc)

const date = dayjs.utc('2025-02-04', 'YYYY-MM-DD').startOf('d')
const channel = { site_id: 'Sydney#ABC1' }

it('can generate valid url', () => {
  expect(url({ date, channel })).toBe(
    'https://cdn.iview.abc.net.au/epg/processed/Sydney_2025-02-04.json'
  )
})

it('can parse response', () => {
  const content = fs.readFileSync(path.resolve(__dirname, '__data__/content.json'))
  const results = parser({ content, channel }).map(p => {
    p.start = p.start.toJSON()
    p.stop = p.stop.toJSON()
    return p
  })

  expect(results.length).toBe(30)
  expect(results[0]).toMatchObject({
    title: "Julia Zemiro's Home Delivery",
    sub_title: 'Maggie Beer',
    description:
      "The kitchen Maggie Beer made famous in The Cook and the Chef may be in the heart of the Barossa Valley, but our most beloved foodie meets up with Julia where she grew up in Sydney's Lakemba.",
    category: ['Entertainment', 'Factual'],
    rating: {
      system: 'ACB',
      value: 'G'
    },
    season: null,
    episode: null,
    image: 'https://www.abc.net.au/tv/common/images/publicity/LE1761H002S00_460.jpg',
    start: '2025-02-03T12:40:00.000Z',
    stop: '2025-02-03T13:09:00.000Z'
  })
})

it('can handle empty guide', () => {
  const results = parser({
    content: fs.readFileSync(path.resolve(__dirname, '__data__/no_content.html')),
    channel
  })

  expect(results).toMatchObject([])
})
