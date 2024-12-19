const { url, parser } = require('./stod2.is.config.js')
const dayjs = require('dayjs')
const utc = require('dayjs/plugin/utc')
dayjs.extend(utc)

const date = dayjs.utc('2024-12-19', 'YYYY-MM-DD').startOf('d')
const channel = { site_id: 'stod2', xmltv_id: 'Stod2.is', lang: 'is' }

it('can generate valid url', () => {
  expect(url({ channel, date })).toBe('https://api.stod2.is/dagskra/api/stod2/2024-12-19')
})

it('can parse response', () => {
  const content = `[{"start":"2024-12-19T08:00:00Z","stop":"2024-12-19T08:15:00Z","title":"Heimsókn"}]`
  const results = parser({ content })

  expect(results).toMatchObject([
    {
      start: '2024-12-19T08:00:00Z',
      stop: '2024-12-19T08:15:00Z',
      title: 'Heimsókn'
    }
  ])
})

it('can handle empty guide', () => {
  const results = parser({ content: '' })

  expect(results).toMatchObject([])
})