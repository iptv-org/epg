// npx epg-grabber --config=sites/tapdmv.com/tapdmv.com.config.js --channels=sites/tapdmv.com/tapdmv.com.channels.xml --output=guide.xml --days=2
// npm run channels:parse -- --config=./sites/tapdmv.com/tapdmv.com.config.js --output=./sites/tapdmv.com/tapdmv.com.channels.xml

const { parser, url } = require('./tapdmv.com.config.js')
const dayjs = require('dayjs')
const utc = require('dayjs/plugin/utc')
const customParseFormat = require('dayjs/plugin/customParseFormat')
dayjs.extend(customParseFormat)
dayjs.extend(utc)

const date = dayjs.utc('2022-10-04', 'YYYY-MM-DD').startOf('d')
const channel = {
  site_id: '94b7db9b-5bbd-47d3-a2d3-ce792342a756',
  xmltv_id: 'TAPActionFlix.ph'
}

it('can generate valid url', () => {
  expect(url({ channel, date })).toBe(
    'https://epg.tapdmv.com/calendar/94b7db9b-5bbd-47d3-a2d3-ce792342a756?%24limit=10000&%24sort%5BcreatedAt%5D=-1&start=2022-10-04T00:00:00.000Z&end=2022-10-05T00:00:00.000Z'
  )
})

it('can parse response', () => {
  const content = `[{"id":"0afc3cc0-eab8-4960-a8b5-55d76edeb8f0","program":"The Bourne Ultimatum","episode":"The Bourne Ultimatum","description":"Jason Bourne dodges a ruthless C.I.A. official and his Agents from a new assassination program while searching for the origins of his life as a trained killer.","genre":"Action","thumbnailImage":"https://s3.ap-southeast-1.amazonaws.com/epg.tapdmv.com/tapactionflix.png","startTime":"2022-10-03T23:05:00.000Z","endTime":"2022-10-04T01:00:00.000Z","fileId":"94b7db9b-5bbd-47d3-a2d3-ce792342a756","createdAt":"2022-09-30T13:02:10.586Z","updatedAt":"2022-09-30T13:02:10.586Z"},{"id":"8dccd5e0-ab88-44b6-a2af-18d31c6e9ed7","program":"The Devil Inside ","episode":"The Devil Inside ","description":"In Italy, a woman becomes involved in a series of unauthorized exorcisms during her mission to discover what happened to her mother, who allegedly murdered three people during her own exorcism.","genre":"Horror","thumbnailImage":"https://s3.ap-southeast-1.amazonaws.com/epg.tapdmv.com/tapactionflix.png","startTime":"2022-10-04T01:00:00.000Z","endTime":"2022-10-04T02:25:00.000Z","fileId":"94b7db9b-5bbd-47d3-a2d3-ce792342a756","createdAt":"2022-09-30T13:02:24.031Z","updatedAt":"2022-09-30T13:02:24.031Z"}]`
  const result = parser({ content, date }).map(p => {
    p.start = p.start.toJSON()
    p.stop = p.stop.toJSON()
    return p
  })

  expect(result).toMatchObject([
    {
      start: '2022-10-04T01:00:00.000Z',
      stop: '2022-10-04T02:25:00.000Z',
      title: 'The Devil Inside',
      description:
        'In Italy, a woman becomes involved in a series of unauthorized exorcisms during her mission to discover what happened to her mother, who allegedly murdered three people during her own exorcism.',
      category: 'Horror',
      icon: 'https://s3.ap-southeast-1.amazonaws.com/epg.tapdmv.com/tapactionflix.png'
    }
  ])
})

it('can handle empty guide', () => {
  const result = parser({
    content: `[]`,
    date
  })
  expect(result).toMatchObject([])
})
