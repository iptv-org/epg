// npx epg-grabber --config=sites/getafteritmedia.com/getafteritmedia.com.config.js --channels=sites/getafteritmedia.com/getafteritmedia.com.channels.xml --output=guide.xml --days=2

const { parser, url } = require('./getafteritmedia.com.config.js')
const fs = require('fs')
const path = require('path')
const dayjs = require('dayjs')
const utc = require('dayjs/plugin/utc')
const customParseFormat = require('dayjs/plugin/customParseFormat')
dayjs.extend(customParseFormat)
dayjs.extend(utc)

const date = dayjs.utc('2022-11-26', 'YYYY-MM-DD').startOf('d')
const channel = {
  site_id: '494637005',
  xmltv_id: 'REVNWebFeed.us'
}

it('can generate valid url', () => {
  expect(url).toBe(
    'https://docs.google.com/spreadsheets/d/e/2PACX-1vQcDmb9OnO0HpbjINfGaepqgGTp3VSmPs7hs654n3sRKrq4Q9y6uPSEvVvq9MwTLYG_n_V7vh0rFYP9/pubhtml'
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

  expect(results[0]).toMatchObject({
    start: '2022-11-26T05:00:00.000Z',
    stop: '2022-11-26T05:30:00.000Z',
    title: `The Appraisers`
  })
})

it('can handle empty guide', () => {
  const result = parser({
    date,
    channel,
    content: `<!DOCTYPE html><html><head></head><body></body></html>`
  })
  expect(result).toMatchObject([])
})
