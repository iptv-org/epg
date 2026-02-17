const { parser, url } = require('./mewatch.sg.config.js')
const fs = require('fs')
const path = require('path')
const dayjs = require('dayjs')
const utc = require('dayjs/plugin/utc')
const customParseFormat = require('dayjs/plugin/customParseFormat')
dayjs.extend(customParseFormat)
dayjs.extend(utc)

const date = dayjs.utc('2022-06-11', 'YYYY-MM-DD').startOf('d')
const channel = {
  site_id: '97098',
  xmltv_id: 'Channel5Singapore.sg'
}

it('can generate valid url', () => {
  expect(url({ channel, date })).toBe(
    'https://cdn.mewatch.sg/api/schedules?channels=97098&date=2022-06-10&duration=24&ff=idp,ldp,rpt,cd&hour=12&intersect=true&lang=en&segments=all'
  )
})

it('can parse response', () => {
  const content = fs.readFileSync(path.resolve(__dirname, '__data__/content.json'))
  const result = parser({ content, channel }).map(p => {
    p.start = p.start.toJSON()
    p.stop = p.stop.toJSON()
    return p
  })

  expect(result).toMatchObject([
    {
      start: '2022-06-11T21:00:00.000Z',
      stop: '2022-06-11T21:30:00.000Z',
      title: 'Open Homes S3 - EP 2',
      description:
        'Mike heads down to the Sydney beaches to visit a beachside renovation with all the bells and whistles, we see a kitchen tip and recipe anyone can do at home. We finish up in the prestigious Byron bay to visit a multi million dollar award winning home.',
      image:
        "https://production.togglestatic.com/shain/v1/dataservice/ResizeImage/$value?Format='jpg'&Quality=85&ImageId='4853697'&EntityType='LinearSchedule'&EntityId='788a7dd9-9b12-446f-91b4-c8ac9fec95e5'&Width=1280&Height=720&device=web_browser&subscriptions=Anonymous&segmentationTags=all",
      episode: 2,
      season: 3,
      rating: {
        system: 'IMDA',
        value: 'G'
      }
    }
  ])
})

it('can handle empty guide', () => {
  const result = parser({
    content:
      fs.readFileSync(path.resolve(__dirname, '__data__/no_content.json')),
    channel
  })
  expect(result).toMatchObject([])
})
