const { url, parser } = require('./firstmedia.com.config.js')
const dayjs = require('dayjs')
const utc = require('dayjs/plugin/utc')
dayjs.extend(utc)

const date = dayjs.utc('2023-11-08').startOf('d')
const channel = { site_id: '243', xmltv_id: 'AlJazeeraEnglish.qa', lang: 'id' }

it('can generate valid url', () => {
  expect(url({ channel, date })).toBe(
    'https://api.firstmedia.com/api/content/tv-guide/list?date=08/11/2023&channel=243&startTime=1&endTime=24'
  )
})

it('can parse response', () => {
  const content =
    '{"data":{"entries":{"243":[{"createdAt":"2023-11-05T17:09:34.000Z","updatedAt":"2023-11-05T17:09:34.000Z","id":"009f3a34-8164-4ff9-b981-9dcab1a518fc","channelNo":"243","programmeId":null,"title":"News Live","episode":null,"slug":"news-live","date":"2023-11-08 17:00:00","startTime":"2023-11-08 20:00:00","endTime":"2023-11-08 20:30:00","length":1800,"description":"News Live","long_description":"Up to date news and analysis from around the world.","status":true,"channel":{"id":"7fd7a9a6-af32-c861-d2b0-4ddc7846fad2","key":"AljaInt","no":243,"name":"Al Jazeera International","slug":"al-jazeera-international","website":null,"description":"<p>An international 24-hour English-language It is the first English-language news channel brings you the latest global news stories, analysis from the Middle East &amp; worldwide.</p>","shortDescription":null,"logo":"files/logos/channels/11-NEWS/AlJazeera Int SD-FirstMedia-Chl-243.jpg","externalId":"132","type":"radio","status":true,"chanel":"SD","locale":"id","relationId":"5a6ea4ae-a008-4889-9c68-7a6f1838e81d","onlyfm":null,"genress":[{"id":"1db3bb43-b00d-49af-b272-6c058a8c0b49","name":"International Free View"},{"id":"2e81a4bd-9719-4186-820a-7e035e07be13","name":"News"}]}}]}}}'
  const results = parser({ content, channel, date })

  // All time in Asia/Jakarta
  // 2023-11-08 17:00:00 -> 2023-11-08 20:00:00 = 2023-11-08 03:00:00
  // 2023-11-08 17:00:00 -> 2023-11-08 20:30:00 = 2023-11-08 03:30:00
  expect(results).toMatchObject([
    {
      start: '2023-11-07T20:00:00.000Z',
      stop: '2023-11-07T20:30:00.000Z',
      title: 'News Live',
      description: 'Up to date news and analysis from around the world.'
    }
  ])
})

it('can handle empty guide', () => {
  const results = parser({ content: '' })

  expect(results).toMatchObject([])
})
