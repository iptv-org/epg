const { parser, url } = require('./visionplus.id.config.js')
const fs = require('fs')
const path = require('path')
const dayjs = require('dayjs')
const utc = require('dayjs/plugin/utc')
const customParseFormat = require('dayjs/plugin/customParseFormat')

dayjs.extend(customParseFormat)
dayjs.extend(utc)

jest.mock('axios')

const date = dayjs.utc('2024-11-24', 'YYYY-MM-DD').startOf('d')
const channel = {
  site_id: '00000000000000000079',
  xmltv_id: 'AXN.id',
  lang: 'en'
}
const channelId = { ...channel, lang: 'id' }

it('can generate valid url', () => {
  expect(url({ channel, date })).toBe(
    'https://www.visionplus.id/managetv/tvinfo/events/schedule?language=ENG&serviceId=00000000000000000079&start=2024-11-24T00%3A00%3A00Z&end=2024-11-25T00%3A00%3A00Z&view=cd-events-grid-view'
  )
  expect(url({ channel: channelId, date })).toBe(
    'https://www.visionplus.id/managetv/tvinfo/events/schedule?language=IND&serviceId=00000000000000000079&start=2024-11-24T00%3A00%3A00Z&end=2024-11-25T00%3A00%3A00Z&view=cd-events-grid-view'
  )
})

it('can parse response', () => {
  let content = fs.readFileSync(path.resolve(__dirname, '__data__/content_en.json'))
  let results = parser({ content, channel, date }).map(p => {
    p.start = p.start.toJSON()
    p.stop = p.stop.toJSON()
    return p
  })

  expect(results.length).toBe(1)
  expect(results[0]).toMatchObject({
    start: '2024-11-23T23:30:00.000Z',
    stop: '2024-11-24T00:15:00.000Z',
    title: 'FBI: Most Wanted S4, Ep 18',
    description:
      'After two agents from the Bureau of Land Management go missing while executing a land seizure warrant in Wyoming, the Fugitive Task Force heads west to track them down in an unwelcoming county.',
    season: 4,
    episode: 18
  })

  content = fs.readFileSync(path.resolve(__dirname, '__data__/content_id.json'))
  results = parser({ content, channel: channelId, date }).map(p => {
    p.start = p.start.toJSON()
    p.stop = p.stop.toJSON()
    return p
  })

  expect(results.length).toBe(1)
  expect(results[0]).toMatchObject({
    start: '2024-11-23T23:30:00.000Z',
    stop: '2024-11-24T00:15:00.000Z',
    title: 'FBI: Most Wanted S4, Ep 18',
    description:
      'Satgas Buronan pergi ke wilayah barat untuk melacak keberadaan dua petugas Biro Pengelolaan Lahan yang menghilang saat menjalankan perintah penyitaan lahan di negara bagian yang tak ramah, Wyoming.',
    season: 4,
    episode: 18
  })
})

it('can handle empty guide', () => {
  const content = fs.readFileSync(path.resolve(__dirname, '__data__/no_content.json'))
  const results = parser({ content, channel })

  expect(results).toMatchObject([])
})
