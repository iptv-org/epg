const { parser, url } = require('./arianatelevision.com.config.js')
const fs = require('fs')
const path = require('path')
const dayjs = require('dayjs')
const utc = require('dayjs/plugin/utc')
const customParseFormat = require('dayjs/plugin/customParseFormat')
dayjs.extend(customParseFormat)
dayjs.extend(utc)

const date = dayjs.utc('2021-11-27', 'YYYY-MM-DD').startOf('d')
const channel = {
  site_id: '#',
  xmltv_id: 'ArianaTVNational.af'
}

it('can generate valid url', () => {
  expect(url).toBe('https://www.arianatelevision.com/program-schedule/')
})

it('can parse response', () => {
  const content = fs.readFileSync(path.resolve(__dirname, '__data__/content.html'), 'utf8')
  const result = parser({ content, date }).map(p => {
    p.start = p.start.toJSON()
    p.stop = p.stop.toJSON()
    return p
  })

  expect(result).toMatchObject([
    {
      start: '2021-11-27T02:30:00.000Z',
      stop: '2021-11-27T03:00:00.000Z',
      title: 'City Report'
    },
    {
      start: '2021-11-27T03:00:00.000Z',
      stop: '2021-11-27T10:30:00.000Z',
      title: 'ICC T20 Highlights'
    },
    {
      start: '2021-11-27T10:30:00.000Z',
      stop: '2021-11-28T02:00:00.000Z',
      title: 'ICC T20 World Cup'
    },
    {
      start: '2021-11-28T02:00:00.000Z',
      stop: '2021-11-28T02:30:00.000Z',
      title: 'Quran and Hadis'
    }
  ])
})

it('can handle empty guide', () => {
  const result = parser({
    date,
    channel,
    content: fs.readFileSync(path.resolve(__dirname, '__data__/no_content.html'), 'utf8')
  })
  expect(result).toMatchObject([])
})
