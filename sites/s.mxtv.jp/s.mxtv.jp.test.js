const { parser, url } = require('./s.mxtv.jp.config.js')
const dayjs = require('dayjs')
const utc = require('dayjs/plugin/utc')
const customParseFormat = require('dayjs/plugin/customParseFormat')
dayjs.extend(customParseFormat)
dayjs.extend(utc)

const date = dayjs.utc('2024-08-01', 'YYYY-MM-DD').startOf('d')
const channel = {
  site_id: '2',
  name: 'Tokyo MX2',
  xmltv_id: 'TokyoMX2.jp'
}
const content =
  '[{ "Event_id": "0x6a57", "Start_time": "2024年07月27日05時00分00秒", "Duration": "01:00:00", "Event_name": "ヒーリングタイム＆ヘッドラインニュース", "Event_text": "ねこの足跡", "Component": "480i 16:9 パンベクトルなし", "Sound": "ステレオ", "Event_detail": ""}]'

it('can generate valid url', () => {
  const result = url({ date, channel })
  expect(result).toBe('https://s.mxtv.jp/bangumi_file/json01/SV2EPG20240801.json')
})

it('can parse response', () => {
  const result = parser({ date, channel, content }).map(p => {
    p.start = p.start.toJSON()
    p.stop = p.stop.toJSON()
    return p
  })

  expect(result).toMatchObject([
    {
      start: '2024-07-26T20:00:00.000Z', // UTC time
      stop: '2024-07-26T21:00:00.000Z', // UTC
      title: 'ヒーリングタイム＆ヘッドラインニュース',
      description: 'ねこの足跡',
      image: null,
      category: null
    }
  ])
})

it('can handle empty guide', () => {
  const result = parser({
    date,
    channel,
    content: '[]'
  })
  expect(result).toMatchObject([])
})
