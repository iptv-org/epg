// npx epg-grabber --config=sites/ionplustv.com/ionplustv.com.config.js --channels=sites/ionplustv.com/ionplustv.com.channels.xml --output=guide.xml --days=2

const { parser, url, request } = require('./ionplustv.com.config.js')
const fs = require('fs')
const path = require('path')
const dayjs = require('dayjs')
const utc = require('dayjs/plugin/utc')
const customParseFormat = require('dayjs/plugin/customParseFormat')
dayjs.extend(customParseFormat)
dayjs.extend(utc)

const date = dayjs.utc('2022-11-08', 'YYYY-MM-DD').startOf('d')
const channel = {
  site_id: '#',
  xmltv_id: 'IONPlus.us'
}

it('can generate valid url', () => {
  expect(url({ date })).toBe('https://ionplustv.com/schedule/2022-11-08')
})

it('can parse response', () => {
  const content = fs.readFileSync(path.resolve(__dirname, '__data__/content.html'))

  let results = parser({ content, date })
  results = results.map(p => {
    p.start = p.start.toJSON()
    p.stop = p.stop.toJSON()
    return p
  })

  expect(results[0]).toMatchObject({
    start: '2022-11-08T10:00:00.000Z',
    stop: '2022-11-08T11:00:00.000Z',
    title: 'All For Nothing?',
    sub_title: '226 : Randy & Sarita Vs. Jean-marcel & Melodie',
    icon: 'https://ionplustv.com/static/programs/shows/all-for-nothing/show-banner-all-for-nothing-5ab162f2d8ee6-897aca6d7d9a7d4e2026ca3b592d8b2a047238fa.png',
    rating: {
      system: 'MPA',
      value: 'TV-PG+L'
    },
    description:
      "Randy and Sarita want to take their relationship to the next level and move-in together. Blending their families will require space for seven so they must sell Randy's dated bungalow for top dollar. Paul and Penny have differing opinions on the best plan for this house, but they do agree that all the wallpaper boarders must go! Having struggled to get the demolition started, Randy and Sarita turn up the reno pace in the second week which includes gambling on a poker night fundraiser. In preparation for retirement, Jean-Marcel and Melodie are ready to downsize. Having been out of the real estate market for ages, they have no idea how to ˜wow' the buyers of today. Armed with Paul and Penny's job list to bring their house into the now, they make major progress on day one. Flu, leaks, and a free shower insert that won't fit into their bathroom slow down their pace giving the competition a chance to overtake their early lead."
  })
})

it('can handle empty guide', () => {
  const results = parser({
    content: fs.readFileSync(path.resolve(__dirname, '__data__/no-content.html')),
    date
  })
  expect(results).toMatchObject([])
})
