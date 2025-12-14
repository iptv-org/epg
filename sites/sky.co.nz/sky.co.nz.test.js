const { parser, url, request } = require('./sky.co.nz.config.js')
const fs = require('fs')
const path = require('path')
const dayjs = require('dayjs')
const utc = require('dayjs/plugin/utc')
const tz = require('dayjs/plugin/timezone')
dayjs.extend(utc)
dayjs.extend(tz)

const channel = {
  site_id: '1',
  xmltv_id: 'TVNZ 1'
}
it('can generate valid url', () => {
  expect(url).toBe('https://api.skyone.co.nz/exp/graph')
})

it('can generate valid request method', () => {
  expect(request.method).toBe('POST')
})

it('can parse response', () => {
  const content = fs.readFileSync(path.resolve(__dirname, '__data__/content.json'))
  const result = parser({ content, channel }).map(p => {
    p.start = p.start.toJSON()
    p.stop = p.stop.toJSON()
    return p
  })

  expect(result[0]).toMatchObject({
    title: 'Hard Quiz',
    description:
      "What do King Henry VII, Shaquille O'Neal, dinosaurs and The Adventures of Priscilla, Queen of the Desert have in common? They're all expert topics on tonight's #HardQuiz!",
    rating: { system: 'OFLC', value: 'PG' },
    start: '2025-12-12T10:40:00.000Z',
    stop: '2025-12-12T11:15:00.000Z'
  })

  expect(result[33]).toMatchObject({
    title: 'Obituary',
    description:
      'Season Finale: When Ward reveals what really happened the night Maria Riedle was killed, Elvira sets about framing Hughie for the crime. S1 E6',
    rating: { system: 'OFLC', value: '16' },
    start: '2025-12-13T10:55:00.000Z',
    stop: '2025-12-13T11:50:00.000Z'
  })
})

// Not easy to mock this case, as it's the same repeated message (for all channels ?) 
// with the time space in the message. Only what doesn't change is provided, but will still pass the test out.
it('can handle empty guide', () => {
  const result = parser({
    content: `{
        "locations": [
          {
            "line": 14,
            "column": 11
          }
        ],
        "path": [
          "experience",
          "channelGroup",
          "channels",
          0,
          "slotsForDay"
        ],
        "extensions": {
          "classification": "DataFetchingException"
        }
      }`,
    channel
  })
  expect(result).toMatchObject([])
})
