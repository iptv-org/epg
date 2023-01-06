// npx epg-grabber --config=sites/rthk.hk/rthk.hk.config.js --channels=sites/rthk.hk/rthk.hk.channels.xml --output=guide.xml --days=2

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

const date = dayjs.utc('2022-12-02', 'YYYY-MM-DD').startOf('d')
const channel = {
  site_id: '31',
  xmltv_id: 'RTHKTV31.hk',
  lang: 'zh'
}

it('can generate valid url', () => {
  expect(url({ date })).toBe('https://www.rthk.hk/timetable/main_timetable/20221202')
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
    start: '2022-12-01T16:00:00.000Z',
    stop: '2022-12-01T17:00:00.000Z',
    title: '問天',
    sub_title: '第十四集',
    categories: ['戲劇'],
    icon: 'https://www.rthk.hk/assets/images/rthk/dtt31/thegreataerospace/10239_1920_s.jpg'
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
    start: '2022-12-01T16:00:00.000Z',
    stop: '2022-12-01T17:00:00.000Z',
    title: 'The Great Aerospace',
    sub_title: 'Episode 14',
    categories: ['戲劇'],
    icon: 'https://www.rthk.hk/assets/images/rthk/dtt31/thegreataerospace/10239_1920_s.jpg'
  })
})

it('can handle empty guide', () => {
  const content = fs.readFileSync(path.resolve(__dirname, '__data__/no_content.json'))
  const results = parser({ date, channel, content })

  expect(results).toMatchObject([])
})
