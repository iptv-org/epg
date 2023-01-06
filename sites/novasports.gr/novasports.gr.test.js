// npm run channels:parse -- --config=./sites/novasports.gr/novasports.gr.config.js --output=./sites/novasports.gr/novasports.gr.channels.xml
// npx epg-grabber --config=sites/novasports.gr/novasports.gr.config.js --channels=sites/novasports.gr/novasports.gr.channels.xml --output=guide.xml --days=2

const { parser, url } = require('./novasports.gr.config.js')
const fs = require('fs')
const path = require('path')
const dayjs = require('dayjs')
const utc = require('dayjs/plugin/utc')
const customParseFormat = require('dayjs/plugin/customParseFormat')
dayjs.extend(customParseFormat)
dayjs.extend(utc)

const date = dayjs.utc('2022-10-29', 'YYYY-MM-DD').startOf('d')
const channel = {
  site_id: 'Novasports Premier League',
  xmltv_id: 'NovasportsPremierLeague.gr'
}

it('can generate valid url', () => {
  expect(url({ date })).toBe(
    'https://www.novasports.gr/wp-admin/admin-ajax.php?action=nova_get_template&template=tv-program/broadcast&dt=2022-10-29'
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
    start: '2022-10-29T07:00:00.000Z',
    stop: '2022-10-29T07:30:00.000Z',
    title: 'Classic Match',
    description: 'Τσέλσι - Μάντσεστερ Γ. (1999/00)'
  })
})

it('can handle empty guide', () => {
  const results = parser({
    content: fs.readFileSync(path.resolve(__dirname, '__data__/no_content.html')),
    channel,
    date
  })

  expect(results).toMatchObject([])
})
