// npm run channels:parse -- --config=./sites/tv24.co.uk/tv24.co.uk.config.js --output=./sites/tv24.co.uk/tv24.co.uk.channels.xml
// npx epg-grabber --config=sites/tv24.co.uk/tv24.co.uk.config.js --channels=sites/tv24.co.uk/tv24.co.uk.channels.xml --output=guide.xml --days=2

const { parser, url } = require('./tv24.co.uk.config.js')
const fs = require('fs')
const path = require('path')
const dayjs = require('dayjs')
const utc = require('dayjs/plugin/utc')
const customParseFormat = require('dayjs/plugin/customParseFormat')
dayjs.extend(customParseFormat)
dayjs.extend(utc)

const date = dayjs.utc('2022-08-28', 'YYYY-MM-DD').startOf('d')
const channel = {
  site_id: 'bbc-two',
  xmltv_id: 'BBCTwo.uk'
}

it('can generate valid url', () => {
  expect(url({ channel, date })).toBe('https://tv24.co.uk/x/channel/bbc-two/0/2022-08-28')
})

it('can parse response', () => {
  const content = fs.readFileSync(path.resolve(__dirname, '__data__/content.html'))
  const results = parser({ content, date }).map(p => {
    p.start = p.start.toJSON()
    p.stop = p.stop.toJSON()
    return p
  })

  expect(results[0]).toMatchObject({
    start: '2022-08-28T05:05:00.000Z',
    stop: '2022-08-28T06:05:00.000Z',
    title: "Gardeners' World",
    description:
      'Arit Anderson discovers a paradise garden in Cambridge which has become a focal point for the local community, and Frances Tophill shares the joy of collecting and saving heirloom vegetable seeds on a visit to Pembrokeshire.'
  })

  expect(results[22]).toMatchObject({
    start: '2022-08-29T05:30:00.000Z',
    stop: '2022-08-29T06:00:00.000Z',
    title: 'Animal Park',
    description:
      "One of the park's vultures has laid an egg. It is ten years since Longleat had a successfully reared vulture chick, so the keepers send Hamza to find out if the parents are incubating their egg."
  })
})

it('can handle empty guide', () => {
  const result = parser({
    content: ''
  })
  expect(result).toMatchObject([])
})
