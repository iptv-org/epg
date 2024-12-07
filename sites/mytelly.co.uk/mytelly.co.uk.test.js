const { parser, url } = require('./mytelly.co.uk.config.js')
const fs = require('fs')
const path = require('path')
const dayjs = require('dayjs')
const utc = require('dayjs/plugin/utc')
const customParseFormat = require('dayjs/plugin/customParseFormat')
dayjs.extend(customParseFormat)
dayjs.extend(utc)

const date = dayjs.utc('2024-12-07', 'YYYY-MM-DD').startOf('d')
const channel = {
  site_id: '713/bbc-one-london',
  xmltv_id: 'BBCOneLondon.uk'
}

it('can generate valid url', () => {
  expect(url({ channel, date })).toBe(
    'https://www.mytelly.co.uk/tv-guide/listings/channel/713/bbc-one-london.html?dt=2024-12-07'
  )
})

it('can parse response', async () => {
  const content = fs.readFileSync(path.resolve(__dirname, '__data__/content.html'))
  const results = (await parser({ content, channel, date })).map(p => {
    p.start = p.start.toJSON()
    p.stop = p.stop.toJSON()
    return p
  })

  expect(results.length).toBe(25)
  expect(results[0]).toMatchObject({
    start: '2024-12-07T00:00:00.000Z',
    stop: '2024-12-07T02:05:00.000Z',
    title: 'Captain Phillips (2013)'
  })
  expect(results[24]).toMatchObject({
    start: '2024-12-07T23:35:00.000Z',
    stop: '2024-12-08T00:05:00.000Z',
    title: 'The Rap Game UK',
    subTitle: 'Past and Pressure - Season 6, Episode 5'
  })
})

it('can handle empty guide', async () => {
  const result = await parser({
    date,
    channel,
    content: '<!DOCTYPE html><html><head></head><body></body></html>'
  })
  expect(result).toMatchObject([])
})
