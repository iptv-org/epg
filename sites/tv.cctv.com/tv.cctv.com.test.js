const { parser, url } = require('./tv.cctv.com.config.js')
const fs = require('fs')
const path = require('path')
const dayjs = require('dayjs')
const utc = require('dayjs/plugin/utc')
const customParseFormat = require('dayjs/plugin/customParseFormat')
dayjs.extend(customParseFormat)
dayjs.extend(utc)

const date = dayjs.utc('2023-11-30', 'YYYY-MM-DD').startOf('d')
const channel = {
  site_id: 'cctv1',
  xmltv_id: 'CCTV1.cn'
}

it('can generate valid url', () => {
  expect(url({ channel, date })).toBe(
    'https://api.cntv.cn/epg/getEpgInfoByChannelNew?serviceId=tvcctv&c=cctv1&d=20231130'
  )
})

it('can parse response', () => {
  const content = fs.readFileSync(path.resolve(__dirname, '__data__/content.json'))
  const results = parser({ channel, content }).map(p => {
    p.start = p.start.toJSON()
    p.stop = p.stop.toJSON()
    return p
  })

  expect(results.length).toBe(37)

  expect(results[0]).toMatchObject({
    start: '2023-11-29T17:13:00.000Z',
    stop: '2023-11-29T17:41:15.000Z',
    title: '今日说法-2023-302'
  })

  expect(results[36]).toMatchObject({
    start: '2023-11-30T15:30:15.000Z',
    stop: '2023-11-30T15:59:00.000Z',
    title: '非遗里的中国-4'
  })
})

it('can handle empty guide', () => {
  const results = parser({
    channel,
    content: '{"errcode":"1001","msg":"params error"}'
  })
  expect(results.length).toBe(0)
})
