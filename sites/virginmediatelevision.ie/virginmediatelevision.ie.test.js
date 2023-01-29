// npx epg-grabber --config=sites/virginmediatelevision.ie/virginmediatelevision.ie.config.js --channels=sites/virginmediatelevision.ie/virginmediatelevision.ie.channels.xml --output=guide.xml --days=2

const { parser, url } = require('./virginmediatelevision.ie.config.js')
const fs = require('fs')
const path = require('path')
const dayjs = require('dayjs')
const utc = require('dayjs/plugin/utc')
const customParseFormat = require('dayjs/plugin/customParseFormat')
dayjs.extend(customParseFormat)
dayjs.extend(utc)

const date = dayjs.utc('2023-01-31', 'YYYY-MM-DD').startOf('d')
const channel = {
  site_id: 'one',
  xmltv_id: 'VirginMediaOne.ie'
}

it('can generate valid url', () => {
  expect(url({ date })).toBe(
    'https://www.virginmediatelevision.ie/includes/ajax/tv_guide.php?date=2023-01-31'
  )
})

it('can parse response', () => {
  const content = fs.readFileSync(path.resolve(__dirname, '__data__/content.html'), 'utf8')
  let results = parser({ content, channel, date })
  results = results.map(p => {
    p.start = p.start.toJSON()
    p.stop = p.stop.toJSON()
    return p
  })

  expect(results.length).toBe(23)
  expect(results[0]).toMatchObject({
    start: '2023-01-31T00:00:00.000Z',
    stop: '2023-01-31T01:00:00.000Z',
    title: `Chasing Shadows`,
    sub_title: '',
    description: `A detective sergeant and expert in the field of serial killers working for the Missing Persons Bureau tries to protect the general public from evil.`,
    icon: 'https://bcboltvirgin.akamaized.net/player/shows/1498_517x291_1528141264.jpg'
  })
})

it('can handle empty guide', () => {
  const results = parser({
    date,
    channel,
    content: `<!DOCTYPE html><html><head></head><body></body></html>`
  })

  expect(results).toMatchObject([])
})
