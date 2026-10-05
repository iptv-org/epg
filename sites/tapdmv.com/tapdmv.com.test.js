const { parser, url } = require('./tapdmv.com.config.js')
const fs = require('fs')
const path = require('path')
const dayjs = require('dayjs')
const utc = require('dayjs/plugin/utc')
const customParseFormat = require('dayjs/plugin/customParseFormat')
dayjs.extend(customParseFormat)
dayjs.extend(utc)

const date = dayjs.utc('2022-10-04', 'YYYY-MM-DD').startOf('d')
const channel = {
  site_id: '94b7db9b-5bbd-47d3-a2d3-ce792342a756',
  xmltv_id: 'TAPActionFlix.ph'
}

it('can generate valid url', () => {
  expect(url({ channel, date })).toBe(
    'https://epg.tapdmv.com/calendar/94b7db9b-5bbd-47d3-a2d3-ce792342a756?%24limit=10000&%24sort%5BcreatedAt%5D=-1&start=2022-10-04T00:00:00.000Z&end=2022-10-05T00:00:00.000Z'
  )
})

it('can parse response', () => {
  const content = fs.readFileSync(path.resolve(__dirname, '__data__/content.json'))
  const result = parser({ content, date }).map(p => {
    p.start = p.start.toJSON()
    p.stop = p.stop.toJSON()
    return p
  })

  expect(result).toMatchObject([
    {
      start: '2022-10-04T01:00:00.000Z',
      stop: '2022-10-04T02:25:00.000Z',
      title: 'The Devil Inside',
      description:
        'In Italy, a woman becomes involved in a series of unauthorized exorcisms during her mission to discover what happened to her mother, who allegedly murdered three people during her own exorcism.',
      category: 'Horror',
      image: 'https://s3.ap-southeast-1.amazonaws.com/epg.tapdmv.com/tapactionflix.png'
    }
  ])
})

it('can handle empty guide', () => {
  const result = parser({
    content: fs.readFileSync(path.resolve(__dirname, '__data__/no_content.json')),
    date
  })
  expect(result).toMatchObject([])
})
