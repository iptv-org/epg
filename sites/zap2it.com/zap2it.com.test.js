const { parser, url } = require('./zap2it.com.config.js')
const dayjs = require('dayjs')
const utc = require('dayjs/plugin/utc')
const customParseFormat = require('dayjs/plugin/customParseFormat')
dayjs.extend(customParseFormat)
dayjs.extend(utc)

const date = dayjs.utc('2025-02-06', 'YYYY-MM-DD').startOf('d')
const channel = { site_id: 'X/USA-NY31695-DEFAULT/NY31695/USA/13302/49141', xmltv_id: 'Spectrum News 1' }

it('can generate valid url', () => {
  expect(url).toBe('https://tvlistings.zap2it.com/api/sslgrid')
})

it('can parse response', () => {
  const content = JSON.stringify({
    '2025-02-06': [
      {
        program: {
          title: 'Your Afternoon on Spectrum News 1 - Central NY',
          episodeTitle: '',
          shortDesc: '',
          genres: [],
          season: '',
          episode: '',
          releaseYear: ''
        },
        startTime: 1738868400,
        endTime: 1738872000,
        thumbnail: ''
      },
      {
        program: {
          title: 'Your Afternoon on Spectrum News 1 - Central NY',
          episodeTitle: '',
          shortDesc: '',
          genres: [],
          season: '',
          episode: '',
          releaseYear: ''
        },
        startTime: 1738872000,
        endTime: 1738875600,
        thumbnail: ''
      }
    ]
  })

  const results = parser({ content, date })

  expect(results.length).toBe(2)
  expect(results[0]).toMatchObject({
    title: 'Your Afternoon on Spectrum News 1 - Central NY',
    start: dayjs.unix(1738868400).utc().format('YYYY-MM-DD HH:mm:ss'),
    stop: dayjs.unix(1738872000).utc().format('YYYY-MM-DD HH:mm:ss')
  })
  expect(results[1]).toMatchObject({
    title: 'Your Afternoon on Spectrum News 1 - Central NY',
    start: dayjs.unix(1738872000).utc().format('YYYY-MM-DD HH:mm:ss'),
    stop: dayjs.unix(1738875600).utc().format('YYYY-MM-DD HH:mm:ss')
  })
})

it('can handle empty guide', () => {
  const result = parser({
    date,
    channel,
    content: '{}'
  })

  expect(result).toEqual([])
})
