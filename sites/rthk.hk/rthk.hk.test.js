// npx epg-grabber --config=sites/rthk.hk/rthk.hk.config.js --channels=sites/rthk.hk/rthk.hk_hk-zh.channels.xml --output=guide.xml --days=2
// npx epg-grabber --config=sites/rthk.hk/rthk.hk.config.js --channels=sites/rthk.hk/rthk.hk_hk-en.channels.xml --output=guide.xml --days=2

const { parser, url, request } = require('./rthk.hk.config.js')
const fs = require('fs')
const path = require('path')
const axios = require('axios')
const dayjs = require('dayjs')
const utc = require('dayjs/plugin/utc')
const customParseFormat = require('dayjs/plugin/customParseFormat')
dayjs.extend(customParseFormat)
dayjs.extend(utc)

jest.mock('axios')

const date = dayjs.utc('2022-11-15', 'YYYY-MM-DD').startOf('d')
const channel = {
  site_id: '31',
  xmltv_id: 'RTHKTV31.hk',
  lang: 'zh'
}

it('can generate valid url', () => {
  expect(url({ date })).toBe('https://www.rthk.hk/timetable/main_timetable/20221115')
})

it('can generate valid request headers', () => {
  expect(request.headers({ channel })).toMatchObject({
    Cookie: 'lang=zh'
  })
})

it('can generate valid request headers for English version', () => {
  const channelEN = { ...channel, lang: 'en' }

  expect(request.headers({ channel: channelEN })).toMatchObject({
    Cookie: 'lang=en'
  })
})

it('can parse response', () => {
  const content = fs.readFileSync(path.resolve(__dirname, '__data__/content_zh.json'))
  let results = parser({ content, channel, date })
  results = results.map(p => {
    p.start = p.start.toJSON()
    p.stop = p.stop.toJSON()
    return p
  })

  expect(results[0]).toMatchObject({
    start: '2022-11-14T16:00:00.000Z',
    stop: '2022-11-14T16:30:00.000Z',
    title: '救Bee大作戰',
    sub_title: '第二集',
    categories: ['知識', '娛樂'],
    icon: 'https://www.rthk.hk/assets/rthk/images/tv/player/480x272.jpg'
  })
})

it('can parse response in English', () => {
  const content = fs.readFileSync(path.resolve(__dirname, '__data__/content_en.json'))
  let results = parser({ content, channel, date })
  results = results.map(p => {
    p.start = p.start.toJSON()
    p.stop = p.stop.toJSON()
    return p
  })

  expect(results[0]).toMatchObject({
    start: '2022-11-14T16:00:00.000Z',
    stop: '2022-11-14T16:30:00.000Z',
    title: "Jimmy's Big Bee Rescue",
    sub_title: 'Episode 2',
    categories: ['知識', '娛樂'],
    icon: 'https://www.rthk.hk/assets/rthk/images/tv/player/480x272.jpg'
  })
})

it('can handle empty guide', () => {
  const content = fs.readFileSync(path.resolve(__dirname, '__data__/no_content.json'))
  const results = parser({ date, channel, content })

  expect(results).toMatchObject([])
})
