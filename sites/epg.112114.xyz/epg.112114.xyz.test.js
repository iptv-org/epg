const { parser, url } = require('./epg.112114.xyz.config.js')
const dayjs = require('dayjs')
const utc = require('dayjs/plugin/utc')
const timezone = require('dayjs/plugin/timezone')
const fs = require('fs')
const path = require('path')

dayjs.extend(utc)
dayjs.extend(timezone)

const date = dayjs.utc('2025-01-11', 'YYYY-MM-DD').startOf('d')
const channel = { site_id: 'BTV文艺', xmltv_id: 'BRTVArtsChannel.cn', lang: 'zh' }

it('can generate valid url', () => {
  expect(url).toBe('https://epg.112114.xyz/pp.xml')
})

it('can parse response', () => {
  const content = fs.readFileSync(path.resolve(__dirname, '__data__/content.xml'))
  const results = parser({ date, content, channel })

  expect(results.length).toBe(28)
  expect(results[0]).toMatchObject({
    start: '2025-01-11T00:07:00.000Z',
    stop: '2025-01-11T00:24:00.000Z',
    title: '每日文艺播报'
  })
  expect(results[27]).toMatchObject({
    start: '2025-01-11T15:16:00.000Z',
    stop: '2025-01-11T15:59:00.000Z',
    title: '笑动剧场'
  })
})

it('can handle empty guide', () => {
  const result = parser({
    date,
    channel,
    content: ''
  })
  expect(result).toMatchObject([])
})
