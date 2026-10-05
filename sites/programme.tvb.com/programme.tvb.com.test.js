const { parser, url } = require('./programme.tvb.com.config.js')
const fs = require('fs')
const path = require('path')
const dayjs = require('dayjs')
const utc = require('dayjs/plugin/utc')
const customParseFormat = require('dayjs/plugin/customParseFormat')

dayjs.extend(customParseFormat)
dayjs.extend(utc)

const content = fs.readFileSync(path.resolve(__dirname, '__data__/content.json'))
const date = dayjs.utc('2024-12-06', 'YYYY-MM-DD').startOf('d')
const channel = {
  site_id: 'J',
  xmltv_id: 'Jade.hk',
  lang: 'en'
}

it('can generate valid url', () => {
  const time = 1733491000
  expect(url({ channel, date, time })).toBe(
    'https://programme.tvb.com/api/schedule?input_date=20241206&network_code=J&_t=1733491000'
  )
})

it('can parse response (en)', () => {
  const results = parser({ content, channel, date }).map(p => {
    p.start = p.start.toJSON()
    p.stop = p.stop.toJSON()
    return p
  })

  expect(results.length).toBe(3)
  expect(results[1]).toMatchObject({
    start: '2024-12-06T15:55:00.000Z',
    stop: '2024-12-06T16:55:00.000Z',
    title: 'Line Walker: Bull Fight#16[Can][PG]'
  })
})

it('can parse response (zh)', () => {
  const results = parser({ content, channel: { ...channel, lang: 'zh' }, date }).map(p => {
    p.start = p.start.toJSON()
    p.stop = p.stop.toJSON()
    return p
  })

  expect(results.length).toBe(3)
  expect(results[1]).toMatchObject({
    start: '2024-12-06T15:55:00.000Z',
    stop: '2024-12-06T16:55:00.000Z',
    title: '使徒行者3#16[粵][PG]',
    description:
      '文鼎從淑梅手上救走大聖爺兒子，大聖爺還恩於歡喜，答允支持九指強。崇聯社定下選舉日子，恰巧是韋傑出獄之日，頭目們顧念舊日恩義，紛紛轉投浩洋。浩洋帶亞希逛傢俬店，憧憬二人未來。亞希向家強承認愛上浩洋，要求退出臥底任務。作榮與歡喜暗中會面，將國際犯罪組織「永恆幫」情報交給他。阿火遭家強出賣，到沐足店搶錢。家強逮住阿火，惟被合星誤會而受拘捕。家強把正植遺下的頸鏈和學生證交還，合星意識到家強已知悉正植身世。'
  })
})

it('can handle empty guide', () => {
  const result = parser({
    content: '',
    date
  })
  expect(result).toMatchObject([])
})
