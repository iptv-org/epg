// npm run channels:parse -- --config=./sites/zap.co.ao/zap.co.ao.config.js --output=./sites/zap.co.ao/zap.co.ao.channels.xml
// npx epg-grabber --config=sites/zap.co.ao/zap.co.ao.config.js --channels=sites/zap.co.ao/zap.co.ao.channels.xml --output=guide.xml

const { parser, url } = require('./zap.co.ao.config.js')
const fs = require('fs')
const path = require('path')
const dayjs = require('dayjs')
const utc = require('dayjs/plugin/utc')
const customParseFormat = require('dayjs/plugin/customParseFormat')
dayjs.extend(customParseFormat)
dayjs.extend(utc)

const date = dayjs.utc('2023-05-28', 'YYYY-MM-DD').startOf('d')
const channel = {
  site_id: '2275',
  xmltv_id: 'TPA1.ao'
}

it('can generate valid url', () => {
  expect(url({ date, channel })).toBe(
    'https://zapon.zapsi.net/ao/m/api/epg/events?date=20230528&channel=2275'
  )
})

it('can parse response', () => {
  const content = fs.readFileSync(path.resolve(__dirname, '__data__/content.json'), 'utf8')
  const results = parser({ content }).map(p => {
    p.start = p.start.toJSON()
    p.stop = p.stop.toJSON()
    return p
  })

  expect(results[0]).toMatchObject({
    start: '2023-05-27T23:00:00.000Z',
    stop: '2023-05-28T00:00:00.000Z',
    title: `Jornal da Meia-Noite`,
    description:
      'Um jornal diferente do Telejornal, por conter análise, comentários e coluna com jornalistas experientes sobre factos do dia a dia.',
    category: 'Noticiário'
  })
})

it('can handle empty guide', () => {
  const results = parser({
    content: `[]`
  })
  expect(results).toMatchObject([])
})
