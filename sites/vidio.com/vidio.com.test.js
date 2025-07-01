const { parser, url, request } = require('./vidio.com.config.js')
const fs = require('fs')
const path = require('path')
const axios = require('axios')
const dayjs = require('dayjs')
const utc = require('dayjs/plugin/utc')
const customParseFormat = require('dayjs/plugin/customParseFormat')

dayjs.extend(customParseFormat)
dayjs.extend(utc)

jest.mock('axios')

const date = dayjs.utc('2025-07-01', 'YYYY-MM-DD').startOf('d')
const channel = {
  site_id: '204',
  xmltv_id: 'SCTV.id'
}

it('can generate valid url', () => {
  expect(url({ channel, date })).toBe(
    'https://api.vidio.com/livestreamings/204/schedules?filter[date]=2025-07-01'
  )
})

it('can generate valid request headers', async () => {
  axios.post.mockImplementation(url => {
    if (url === 'https://www.vidio.com/auth') {
      return Promise.resolve({
        data: JSON.parse(fs.readFileSync(path.resolve(__dirname, '__data__/auth.json')))
      })
    } else {
      return Promise.resolve({ data: '' })
    }
  })

  const result = await request.headers()
  expect(result).toMatchObject({
    'X-API-Key':
      'CH1ZFsN4N/MIfAds1DL9mP151CNqIpWHqZGRr+LkvUyiq3FRPuP1Kt6aK+pG3nEC1FXt0ZAAJ5FKP8QU8CZ5/jQdSYLVeFwl9NoIkegVpR6b7W2ZwbaF00OPr6ON1/FpLQ3RiUzTPpAqe7f+fwhOr0KrKy8PpCa54OHogaEjI3w=',
    'X-Secure-Level': 2,
  })
})

it('can parse response', () => {
  const content = fs.readFileSync(path.resolve(__dirname, '__data__/content.json'))
  const results = parser({ content, channel, date }).map(p => {
    p.start = p.start.toJSON()
    p.stop = p.stop.toJSON()
    return p
  })

  expect(results.length).toBe(21)
  expect(results[0]).toMatchObject({
    start: '2025-06-30T15:57:00.000Z',
    stop: '2025-06-30T17:29:00.000Z',
    title: 'Ftv PrimeTime : Cinta Dodol Inilah Yang Membuatku Lengket Padamu',
    description: 'Film televisi yang mengangkat kisah romantisme kehidupan dengan konflik yang menarik. tayang setiap hari'
  })
})

it('can handle empty guide', () => {
  const content = fs.readFileSync(path.resolve(__dirname, '__data__/no_content.json'))
  const results = parser({ content, channel })

  expect(results).toMatchObject([])
})
