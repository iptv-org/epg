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
  site_id: '571922',
  xmltv_id: 'AnimaxAsia.sg@SD'
}

it('can generate valid url', () => {
  expect(url({ channel, date })).toBe(
    'https://cdn.mewatch.sg/api/schedules?channels=571922&date=2022-06-10&duration=24&ff=idp,ldp,rpt,cd&hour=12&intersect=true&lang=en&segments=all'
  )
})

it('can parse response', () => {
  const content = fs.readFileSync(path.resolve(__dirname, '__data__/content.json'))
  const result = parser({ content, channel }).map(p => {
    p.start = p.start.toJSON()
    p.stop = p.stop.toJSON()
    return p
  })

  expect(result.length).toBe(45)
  expect(result[0]).toMatchObject({
    title: 'Tsukimichi -Moonlit Fantasy- Season 2',
    subTitle: 'Why Am I A Teacher?!',
    description:
      'After arriving in Rotsgard, Makoto and Shiki gather info for their new store but soon help a girl named Luria in trouble.',
    image:
      "https://prod98.togglestatic.com/shain/v1/dataservice/ResizeImage/$value?Format='jpg'&Quality=85&ImageId='13651065'&EntityType='LinearSchedule'&EntityId='fdb1a2e4-efe5-41dd-8560-84d4c3f50459'&Width=1280&Height=720",
    episode: 4,
    season: null,
    start: '2026-04-19T00:00:00.000Z',
    stop: '2026-04-19T00:30:00.000Z',
    rating: { system: 'IMDA', value: 'PG13' }
  })
})

it('can handle empty guide', () => {
  const result = parser({
    content:
      fs.readFileSync(path.resolve(__dirname, '__data__/no_content.json')),
    channel
  })
  expect(result).toMatchObject([])
})
