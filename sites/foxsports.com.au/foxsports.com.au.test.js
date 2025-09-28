const { parser, url } = require('./foxsports.com.au.config.js')
const fs = require('fs')
const path = require('path')
const dayjs = require('dayjs')
const utc = require('dayjs/plugin/utc')
dayjs.extend(utc)

const date = dayjs.utc('2022-12-14', 'YYYY-MM-DD').startOf('d')
const channel = {
  site_id: '2',
  xmltv_id: 'FoxLeague.au'
}
it('can generate valid url', () => {
  expect(url({ date })).toBe(
    'https://tvguide.foxsports.com.au/granite-api/programmes.json?from=2022-12-14&to=2022-12-15'
  )
})

it('can parse response', () => {
  const content = fs.readFileSync(path.resolve(__dirname, '__data__/content.json'))
  const result = parser({ content, channel }).map(p => {
    p.start = p.start.toJSON()
    p.stop = p.stop.toJSON()
    return p
  })

  expect(result).toMatchObject([
    {
      title: 'NRL',
      sub_title: 'Eels v Titans',
      description:
        'The Eels and Titans have plenty of motivation this season after heartbreaking Finals losses in 2021. Parramatta has won their past five against Gold Coast.',
      category: 'Rugby League',
      start: '2022-12-13T13:00:00.000Z',
      stop: '2022-12-13T14:00:00.000Z'
    }
  ])
})

it('can handle empty guide', () => {
  const result = parser({content: fs.readFileSync(path.resolve(__dirname, '__data__/no_content.json'))}, channel)
  expect(result).toMatchObject([])
})
