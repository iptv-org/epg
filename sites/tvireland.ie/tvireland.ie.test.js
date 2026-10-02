const { parser, url } = require('./tvireland.ie.config.js')
const fs = require('fs')
const path = require('path')
const dayjs = require('dayjs')
const utc = require('dayjs/plugin/utc')
const customParseFormat = require('dayjs/plugin/customParseFormat')
dayjs.extend(customParseFormat)
dayjs.extend(utc)

const date = dayjs.utc('2023-11-25', 'YYYY-MM-DD').startOf('d')
const channel = {
  site_id: '2378/virgin-media-more',
  xmltv_id: 'VirginMediaMore.ie'
}

it('can generate valid url', () => {
  expect(url({ channel, date })).toBe(
    'https://www.tvireland.ie/tv/listings/channel/2378/virgin-media-more?dt=2023-11-25'
  )
})

it('can parse response', () => {
  const content = fs.readFileSync(path.resolve(__dirname, '__data__/content.html'))
  const results = parser({ content, channel, date }).map(p => {
    p.start = p.start.toJSON()
    p.stop = p.stop.toJSON()
    return p
  })

  expect(results[0]).toMatchObject({
    start: '2023-11-25T00:20:00.000Z',
    stop: '2023-11-25T01:10:00.000Z',
    title: 'Best of Rugby World Cup'
  })

  expect(results[13]).toMatchObject({
    start: '2023-11-25T23:30:00.000Z',
    stop: '2023-11-26T00:00:00.000Z',
    title: 'Stories from the Street'
  })
})

it('can handle empty guide', () => {
  const result = parser({
    date,
    channel,
    content: '<!DOCTYPE html><html><head></head><body></body></html>'
  })
  expect(result).toMatchObject([])
})
