// npx epg-grabber --config=sites/worldfishingnetwork.com/worldfishingnetwork.com.config.js --channels=sites/worldfishingnetwork.com/worldfishingnetwork.com.channels.xml --output=guide.xml --days=2

const { parser, url } = require('./worldfishingnetwork.com.config.js')
const fs = require('fs')
const path = require('path')
const dayjs = require('dayjs')
const utc = require('dayjs/plugin/utc')
const customParseFormat = require('dayjs/plugin/customParseFormat')
dayjs.extend(customParseFormat)
dayjs.extend(utc)

const date = dayjs.utc('2023-01-24', 'YYYY-MM-DD').startOf('d')
const channel = {
  site_id: '#',
  xmltv_id: 'WorldFishingNetwork.us'
}

it('can generate valid url', () => {
  expect(url({ date })).toBe('https://www.worldfishingnetwork.com/schedule/77420?day=Tue')
})

it('can parse response', () => {
  const content = fs.readFileSync(path.resolve(__dirname, '__data__/content.html'), 'utf8')
  let results = parser({ content, date })
  results = results.map(p => {
    p.start = p.start.toJSON()
    p.stop = p.stop.toJSON()
    return p
  })

  expect(results[0]).toMatchObject({
    start: '2023-01-24T05:00:00.000Z',
    stop: '2023-01-24T07:00:00.000Z',
    title: `Major League Fishing`,
    sub_title: 'Challenge Cup Sudden Death Round 2',
    description:
      'Nine anglers race to a target weight on Lake Wylie in the Lucas Oil Challenge Cup, presented by B&W Trailer Hitches, Rock Hill, South Carolina. Only four will move on to the Championship Round.',
    icon: 'https://content.osgnetworks.tv/shows/major-league-fishing-thumbnail.jpg'
  })

  expect(results[41]).toMatchObject({
    start: '2023-01-25T04:30:00.000Z',
    stop: '2023-01-25T05:00:00.000Z',
    title: `Fishing 411`,
    sub_title: 'Flint Wilderness Walleye',
    description:
      'Mark Romanack and Bryan Darland fish walleye on Klotz Lake in the famed Flint Wilderness of Ontario',
    icon: 'https://content.osgnetworks.tv/shows/fishin-411-thumbnail.jpg'
  })
})

it('can handle empty guide', () => {
  const results = parser({
    date,
    content: fs.readFileSync(path.resolve(__dirname, '__data__/no_content.html'), 'utf8')
  })

  expect(results).toMatchObject([])
})
