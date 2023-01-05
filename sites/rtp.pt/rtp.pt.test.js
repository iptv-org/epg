// npm run channels:parse -- --config=./sites/rtp.pt/rtp.pt.config.js --output=./sites/rtp.pt/rtp.pt.channels.xml
// npx epg-grabber --config=sites/rtp.pt/rtp.pt.config.js --channels=sites/rtp.pt/rtp.pt.channels.xml --output=guide.xml --days=2

const { parser, url } = require('./rtp.pt.config.js')
const fs = require('fs')
const path = require('path')
const dayjs = require('dayjs')
const utc = require('dayjs/plugin/utc')
const customParseFormat = require('dayjs/plugin/customParseFormat')
dayjs.extend(customParseFormat)
dayjs.extend(utc)

const date = dayjs.utc('2022-12-02', 'YYYY-MM-DD').startOf('d')
const channel = {
  site_id: 'lis#4',
  xmltv_id: 'RTPMadeira.pt'
}

it('can generate valid url', () => {
  expect(url({ channel, date })).toBe(
    'https://www.rtp.pt/EPG/json/rtp-channels-page/list-grid/tv/4/2-12-2022/lis'
  )
})

it('can parse response', () => {
  const content = fs.readFileSync(path.resolve(__dirname, '__data__/content.json'))
  let results = parser({ content, channel }).map(p => {
    p.start = p.start.toJSON()
    p.stop = p.stop.toJSON()
    return p
  })

  expect(results[9]).toMatchObject({
    start: '2022-12-02T23:30:00.000Z',
    stop: '2022-12-03T00:00:00.000Z',
    title: 'Telejornal Madeira',
    description: 'Informação de proximidade. De confiança!',
    icon: 'https://cdn-images.rtp.pt/EPG/imagens/15790_43438_8820.png?w=384&h=216'
  })
})

it('can handle empty guide', () => {
  const result = parser({ content: '', channel, date })
  expect(result).toMatchObject([])
})
