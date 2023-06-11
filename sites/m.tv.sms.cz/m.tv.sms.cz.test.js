// npx epg-grabber --config=sites/m.tv.sms.cz/m.tv.sms.cz.config.js --channels=sites/m.tv.sms.cz/m.tv.sms.cz.channels.xml --output=guide.xml

const { parser, url } = require('./m.tv.sms.cz.config.js')
const iconv = require('iconv-lite')
const fs = require('fs')
const path = require('path')
const dayjs = require('dayjs')
const utc = require('dayjs/plugin/utc')
const customParseFormat = require('dayjs/plugin/customParseFormat')
dayjs.extend(customParseFormat)
dayjs.extend(utc)

const date = dayjs.utc('2023-06-11', 'YYYY-MM-DD').startOf('d')
const channel = {
  site_id: 'Cero',
  xmltv_id: '0.es'
}

it('can generate valid url', () => {
  expect(url({ channel, date })).toBe(
    'https://m.tv.sms.cz/index.php?stanice=Cero&cas=0&den=2023-06-11'
  )
})

it('can parse response', () => {
  const content = fs.readFileSync(path.resolve(__dirname, '__data__/content.html'))
  const buffer = iconv.encode(content, 'win1250')
  const results = parser({ buffer, date }).map(p => {
    p.start = p.start.toJSON()
    p.stop = p.stop.toJSON()
    return p
  })

  expect(results[0]).toMatchObject({
    start: '2023-06-11T03:21:00.000Z',
    stop: '2023-06-11T04:08:00.000Z',
    title: `Conspiraciones al descubierto: La bomba atómica alemana y el hundimiento del Titanic`,
    description: 'Documentales'
  })

  expect(results[25]).toMatchObject({
    start: '2023-06-12T02:23:00.000Z',
    stop: '2023-06-12T03:23:00.000Z',
    title: `Rapa I (6)`,
    description: 'Series'
  })
})

it('can handle empty guide', () => {
  const result = parser({
    buffer: iconv.encode(
      Buffer.from(
        `<!DOCTYPE html><html><head></head><body><textarea data-jtrt-table-id="508" id="jtrt_table_settings_508" cols="30" rows="10"></textarea></body></html>`
      ),
      'win1250'
    )
  })
  expect(result).toMatchObject([])
})
