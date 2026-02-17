const { parser, url } = require('./mysky.com.ph.config.js')
const fs = require('fs')
const path = require('path')
const dayjs = require('dayjs')
const utc = require('dayjs/plugin/utc')
const customParseFormat = require('dayjs/plugin/customParseFormat')
dayjs.extend(customParseFormat)
dayjs.extend(utc)

const date = dayjs.utc('2022-10-04', 'YYYY-MM-DD').startOf('d')
const channel = {
  site_id: '8',
  xmltv_id: 'KapamilyaChannel.ph'
}

it('can generate valid url', () => {
  expect(url).toBe('https://skyepg.mysky.com.ph/Main/getEventsbyType')
})

it('can parse response', () => {
  const content = fs.readFileSync(path.resolve(__dirname, '__data__/content.json'))
  const result = parser({ content, channel, date }).map(p => {
    p.start = p.start.toJSON()
    p.stop = p.stop.toJSON()
    return p
  })

  expect(result).toMatchObject([
    {
      start: '2022-10-04T11:00:00.000Z',
      stop: '2022-10-04T12:00:00.000Z',
      title: 'TV PATROL',
      description: 'Description example'
    }
  ])
})

it('can handle empty guide', () => {
  const result = parser({
    content: '',
    channel,
    date
  })
  expect(result).toMatchObject([])
})
