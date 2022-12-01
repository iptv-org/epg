// npm run channels:parse -- --config=./sites/rtp.pt/rtp.pt.config.js --output=./sites/rtp.pt/rtp.pt_pt.channels.xml
// npx epg-grabber --config=sites/rtp.pt/rtp.pt.config.js --channels=sites/rtp.pt/rtp.pt_pt.channels.xml --output=guide.xml --days=2

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
  site_id: '1',
  xmltv_id: 'RTP1.pt'
}

it('can generate valid url', () => {
  expect(url({ channel, date })).toBe(
    'https://www.rtp.pt/EPG/json/rtp-channels-page/list-grid/tv/1/2-12-2022'
  )
})

it('can parse response', () => {
  const content = fs.readFileSync(path.resolve(__dirname, '__data__/content.json'))
  let results = parser({ content }).map(p => {
    p.start = p.start.toJSON()
    p.stop = p.stop.toJSON()
    return p
  })

  expect(results[0]).toMatchObject({
    start: '2022-12-02T06:30:00.000Z',
    stop: '2022-12-02T10:00:00.000Z',
    title: 'Bom Dia Portugal',
    description: 'E porque é de manhã que começa o dia, então inicie-o na nossa companhia!',
    icon: 'https://cdn-images.rtp.pt/EPG/imagens/38084_57380_28384.png?w=384&h=216'
  })
})

it('can handle empty guide', () => {
  const result = parser({ content: '', channel, date })
  expect(result).toMatchObject([])
})
