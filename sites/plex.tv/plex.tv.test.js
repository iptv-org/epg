// npm run channels:parse -- --config=./sites/plex.tv/plex.tv.config.js --output=./sites/plex.tv/plex.tv.channels.xml
// npx epg-grabber --config=sites/plex.tv/plex.tv.config.js --channels=sites/plex.tv/plex.tv.channels.xml --output=guide.xml --days=2

const { parser, url, request } = require('./plex.tv.config.js')
const fs = require('fs')
const path = require('path')
const axios = require('axios')
const dayjs = require('dayjs')
const utc = require('dayjs/plugin/utc')
const customParseFormat = require('dayjs/plugin/customParseFormat')
dayjs.extend(customParseFormat)
dayjs.extend(utc)

jest.mock('axios')

const date = dayjs.utc('2022-11-15', 'YYYY-MM-DD').startOf('d')
const channel = {
  site_id: '5e20b730f2f8d5003d739db7-5fc705eb052f6f002ef46057',
  xmltv_id: 'IFCFilmsPicks.us'
}

it('can generate valid url', () => {
  expect(url({ channel, date })).toBe(
    'https://epg.provider.plex.tv/grid?channelGridKey=5fc705eb052f6f002ef46057&date=2022-11-15'
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
    p.start = p.start.toJSON()
    p.stop = p.stop.toJSON()
    return p
  })

  expect(results.length).toBe(14)
  expect(results[0]).toMatchObject({
    start: '2022-11-14T23:04:00.000Z',
    stop: '2022-11-15T00:47:00.000Z',
    title: 'Bound by Flesh',
    description:
      'Conjoined twins Daisy and Violet Hilton were born in 1908, then were sold to a carnival sideshow as babies. They became huge stars of Vaudeville but never earned a penny until they sued for freedom in 1936.',
    icon: 'https://metadata-static.plex.tv/4/gracenote/40b523ad60464f8232f93f861c161384.jpg',
    categories: ['Documentary', 'Movies']
  })

  expect(results[10]).toMatchObject({
    start: '2022-11-15T16:45:00.000Z',
    stop: '2022-11-15T18:47:00.000Z',
    title: 'Antiviral',
    description:
      "Syd has to unravel the mystery surrounding Hannah's death before a virus kills him.",
    icon: 'https://metadata-static.plex.tv/5/gracenote/5ca8432a2e8fb2e8f8157ae142164ef7.jpg',
    categories: ['Horror', 'Science fiction', 'Thriller', 'Movies']
  })

  expect(results[11]).toMatchObject({
    start: '2022-11-15T18:47:00.000Z',
    stop: '2022-11-15T20:36:00.000Z',
    title: 'Cold Weather',
    description:
      'Armed with a few clues and an in-depth knowledge of Sherlock Holmes lore, an ice-factory worker (Cris Lankenau) leads his sister and a co-worker on a search for his missing former lover.',
    icon: 'https://metadata-static.plex.tv/5/gracenote/5150185f3188dbefd10b5d388e8ba115.jpg',
    categories: ['Comedy', 'Mystery', 'Movies']
  })
})

it('can handle empty guide', () => {
  const content = fs.readFileSync(path.resolve(__dirname, '__data__/no_content.json'))
  const results = parser({ content })

  expect(results).toMatchObject([])
})
