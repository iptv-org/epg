const { parser, url, request } = require('./visionplus.id.config.js')
const fs = require('fs')
const path = require('path')
const dayjs = require('dayjs')
const utc = require('dayjs/plugin/utc')
const customParseFormat = require('dayjs/plugin/customParseFormat')
dayjs.extend(customParseFormat)
dayjs.extend(utc)

jest.mock('axios')

const date = dayjs.utc('2024-11-23', 'YYYY-MM-DD').startOf('d')
const channel = {
  site_id: '00000000000000000001',
  xmltv_id: 'RCTI.id',
  lang: 'en'
}
const channelId = { ...channel,  lang: 'id' }


it('can generate valid url', () => {
  expect(url({ channel, date })).toBe(
    'https://www.visionplus.id/managetv/tvinfo/events/schedule?language=ENG&serviceId=00000000000000000001&start=2024-11-23T00%3A00%3A00Z&end=2024-11-24T00%3A00%3A00Z&view=cd-events-grid-view'
  )
  expect(url({ channel: channelId, date })).toBe(
    'https://www.visionplus.id/managetv/tvinfo/events/schedule?language=IND&serviceId=00000000000000000001&start=2024-11-23T00%3A00%3A00Z&end=2024-11-24T00%3A00%3A00Z&view=cd-events-grid-view'
  )
})

it('can parse response', () => {
  let content = fs.readFileSync(path.resolve(__dirname, '__data__/content_en.json'))
  let results = parser({ content, channel, date })
  results = results.map(p => {
    p.start = p.start.toJSON()
    p.stop = p.stop.toJSON()
    return p
  })

  expect(results.length).toBe(1)
  expect(results[0]).toMatchObject({
    start: '2024-11-23T00:15:00.000Z',
    stop: '2024-11-23T01:00:00.000Z',
    title: 'Kiko',
    description: "Kiko tells of a child of a goldfish who is very independent, even though he is an only child. Kiko who is always cheerful has four good friends, namely Lola the discus fish, Ting Ting the crab, Patino the catfish and Poli the betta fish. On the other hand, the antagonists, Karkus the catfish and Pupus the eel, always make Kiko's life chaotic. One day, the lake where Kiko lives is polluted due to the reckless acts of humans, causing Kiko and friends to turn into mutants."
  })

  content = fs.readFileSync(path.resolve(__dirname, '__data__/content_id.json'))
  results = parser({ content, channel: channelId, date })
  results = results.map(p => {
    p.start = p.start.toJSON()
    p.stop = p.stop.toJSON()
    return p
  })

  expect(results.length).toBe(1)
  expect(results[0]).toMatchObject({
    start: '2024-11-23T00:15:00.000Z',
    stop: '2024-11-23T01:00:00.000Z',
    title: 'Kiko',
    description: 'Kiko, seekor anak ikan mas koki yang sangat mandiri, walaupun ia anak tunggal. Kiko selalu riang dan memiliki empat sahabat baik yaitu Lola si ikan diskus, Ting Ting si kepiting, Patino si ikan patin dan Poli si ikan cupang. Di sisi lain, sosok antagonis, Karkus si ikan lele dan Pupus si belut, selalu membuat ricuh kehidupan Kiko.'
  })
})

it('can handle empty guide', () => {
  const content = fs.readFileSync(path.resolve(__dirname, '__data__/no_content.json'))
  const results = parser({ content, channel })

  expect(results).toMatchObject([])
})
