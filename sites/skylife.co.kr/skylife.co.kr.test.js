const { parser, url } = require('./skylife.co.kr.config.js')
const fs = require('fs')
const path = require('path')
const dayjs = require('dayjs')
const utc = require('dayjs/plugin/utc')
const customParseFormat = require('dayjs/plugin/customParseFormat')
dayjs.extend(customParseFormat)
dayjs.extend(utc)

const date = dayjs.utc('2024-06-26', 'YYYY-MM-DD').startOf('d')
const channel = {
  site_id: '4003#798',
  xmltv_id: 'EBS.kr'
}

it('can generate valid url', () => {
  expect(url({ date })).toBe('https://www.skylife.co.kr/api/api/public/tv/schedule/20240626')
})

it('can parse response', () => {
  const content = fs.readFileSync(path.resolve(__dirname, '__data__/content.json'))
  let results = parser({ content, channel }).map(p => {
    p.start = p.start.toJSON()
    p.stop = p.stop.toJSON()
    return p
  })

  expect(results[20]).toMatchObject({
    start: '2024-06-26T00:40:00.000Z', // 20240626094000
    stop: '2024-06-26T01:30:00.000Z', // 20240626103000
    title: '세상에 나쁜 개는 없다',
    description: '문제 있는 반려견들의 행동을 알아 보고 원인을 찾아나가는 프로그램',
    category: '교양/정보',
    actors: ['박영진', '강형욱']
  })
})

it('can handle empty guide', () => {
  const content = fs.readFileSync(path.resolve(__dirname, '__data__/no_content.json'))
  const result = parser({ content, channel })
  expect(result).toMatchObject([])
})
