// npx epg-grabber --config=sites/cosmote.gr/cosmote.gr.config.js --channels=sites/cosmote.gr/cosmote.gr.channels.xml --output=guide.xml

const { parser, url } = require('./cosmote.gr.config.js')
const fs = require('fs')
const path = require('path')
const dayjs = require('dayjs')
const utc = require('dayjs/plugin/utc')
const timezone = require('dayjs/plugin/timezone')
const customParseFormat = require('dayjs/plugin/customParseFormat')

dayjs.extend(utc)
dayjs.extend(timezone)
dayjs.extend(customParseFormat)

const date = dayjs.utc('2023-06-08', 'YYYY-MM-DD').startOf('d')
const channel = {
  site_id: '4e',
  xmltv_id: '4E.gr'
}

it('can generate valid url', () => {
  expect(url({ channel, date })).toBe(
    'https://www.cosmotetv.gr/portal/residential/program/epg/programchannel?p_p_id=channelprogram_WAR_OTETVportlet&p_p_lifecycle=0&_channelprogram_WAR_OTETVportlet_platform=IPTV&_channelprogram_WAR_OTETVportlet_date=08-06-2023&_channelprogram_WAR_OTETVportlet_articleTitleUrl=4e'
  )
})

it('can parse response', () => {
  const content = fs.readFileSync(path.resolve(__dirname, '__data__/content1.html'))
  const results = parser({ content, date }).map(p => {
    p.start = p.start.toJSON()
    p.stop = p.stop.toJSON()
    return p
  })

  expect(results[0]).toMatchObject({
    start: '2023-06-07T20:30:00.000Z',
    stop: '2023-06-07T21:45:00.000Z',
    title: `Τηλεφημερίδα`,
    category: 'Εκπομπή - Μαγκαζίνο'
  })

  expect(results[30]).toMatchObject({
    start: '2023-06-08T19:45:00.000Z',
    stop: '2023-06-08T20:30:00.000Z',
    title: `Μικρό Απόδειπνο`,
    category: 'Special'
  })
})

it('can parse response when the guide starting before midnight', () => {
  const content = fs.readFileSync(path.resolve(__dirname, '__data__/content2.html'))
  const results = parser({ content, date }).map(p => {
    p.start = p.start.toJSON()
    p.stop = p.stop.toJSON()
    return p
  })

  expect(results[0]).toMatchObject({
    start: '2023-06-07T21:30:00.000Z',
    stop: '2023-06-07T22:30:00.000Z',
    title: `Καλύτερα Αργά`,
    category: 'Ψυχαγωγική Εκπομπή'
  })

  expect(results[22]).toMatchObject({
    start: '2023-06-08T19:00:00.000Z',
    stop: '2023-06-08T21:30:00.000Z',
    title: `Πίσω Από Τις Γραμμές`,
    category: 'Εκπομπή - Μαγκαζίνο'
  })
})

it('can handle empty guide', () => {
  const result = parser({
    date,
    content: `<!DOCTYPE html><html><head></head><body></body></html>`
  })
  expect(result).toMatchObject([])
})
