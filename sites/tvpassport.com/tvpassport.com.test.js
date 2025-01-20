const { parser, url, request } = require('./tvpassport.com.config.js')
const fs = require('fs')
const path = require('path')
const dayjs = require('dayjs')
const utc = require('dayjs/plugin/utc')
const customParseFormat = require('dayjs/plugin/customParseFormat')
dayjs.extend(customParseFormat)
dayjs.extend(utc)

const date = dayjs.utc('2022-10-04', 'YYYY-MM-DD').startOf('d')
const channel = {
  site_id: 'youtoo-america-network/5463',
  xmltv_id: 'YTATV.us'
}

it('can generate valid url', () => {
  expect(url({ channel, date })).toBe(
    'https://www.tvpassport.com/tv-listings/stations/youtoo-america-network/5463/2022-10-04'
  )
})

it('can generate valid request headers', () => {
  expect(request.headers).toMatchObject({
    Cookie: 'cisession=e49ff13191d6875887193cae9e324b44ef85768d;'
  })
})

it('can parse response', () => {
  const content = fs.readFileSync(path.resolve(__dirname, '__data__/content.html'))

  let results = parser({ content })
  results = results.map(p => {
    p.start = p.start.toJSON()
    p.stop = p.stop.toJSON()
    return p
  })

  expect(results[0]).toMatchObject({
    start: '2022-10-04T10:00:00.000Z',
    stop: '2022-10-04T10:30:00.000Z',
    title: 'Charlie Moore: No Offense',
    subtitle: 'Under the Influencer',
    category: ['Sports', 'Outdoors'],
    image: 'https://cdn.tvpassport.com/image/show/960x540/69103.jpg',
    rating: {
      system: 'MPA',
      value: 'TV-G'
    },
    actors: ['John Reardon', 'Mayko Nguyen', 'Justin Kelly'],
    director: ['Rob McElhenney'],
    guest: ['Sean Penn'],
    description:
      'Celebrity interviews while fishing in various locations throughout the United States.',
    year: null
  })

  expect(results[1]).toMatchObject({
    start: '2022-10-04T10:30:00.000Z',
    stop: '2022-10-04T11:00:00.000Z',
    title: '1900',
    year: null
  })

  expect(results[2]).toMatchObject({
    start: '2022-10-04T11:00:00.000Z',
    stop: '2022-10-04T12:00:00.000Z',
    title: 'The Mark of Zorro',
    subtitle: null,
    year: '1940'
  })
})

it('can handle empty guide', () => {
  const result = parser({ content: '' })
  expect(result).toMatchObject([])
})
