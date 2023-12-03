const { parser, url } = require('./mytelly.co.uk.config.js')
const fs = require('fs')
const path = require('path')
const dayjs = require('dayjs')
const utc = require('dayjs/plugin/utc')
const customParseFormat = require('dayjs/plugin/customParseFormat')
dayjs.extend(customParseFormat)
dayjs.extend(utc)

const date = dayjs.utc('2023-11-26', 'YYYY-MM-DD').startOf('d')
const channel = {
  site_id: '713/bbc-one-london',
  xmltv_id: 'BBCOneLondon.uk'
}

it('can generate valid url', () => {
  expect(url({ channel, date })).toBe(
    'https://www.mytelly.co.uk/tv-guide/listings/channel/713/bbc-one-london.html?dt=2023-11-26'
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
    start: '2023-11-26T00:15:00.000Z',
    stop: '2023-11-26T01:20:00.000Z',
    title: 'The Rap Game UK'
  })

  expect(results[28]).toMatchObject({
    start: '2023-11-26T23:30:00.000Z',
    stop: '2023-11-27T00:00:00.000Z',
    title: "The Women's Football Show"
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
