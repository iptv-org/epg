const { url, parser } = require('./firstmedia.com.config.js')
const dayjs = require('dayjs')
const utc = require('dayjs/plugin/utc')
dayjs.extend(utc)

const date = dayjs.utc('2023-11-04', 'DD/MM/YYYY').startOf('d')
const channel = { site_id: '243', xmltv_id: 'AlJazeeraEnglish.qa', lang: 'id' }

it('can generate valid url', () => {
  expect(url({ channel, date })).toBe(
    'https://api.firstmedia.com/api/content/tv-guide/list?date=04/11/2023&channel=243&startTime=0&endTime=24'
  )
})

it('can parse response', () => {
  const content =
    '{"data":{"entries":{"243":[{"createdAt":"2023-10-29T17:01:52.000Z","updatedAt":"2023-10-29T17:01:52.000Z","id":"044aebf7-7e14-4a8b-a7da-c401498d83f2","channelNo":"243","programmeId":null,"title":"People and Power: The Launderer P3","episode":null,"slug":"people-and-power-the-launderer-p3","date":"2023-11-03 17:00:00","startTime":"2023-11-04 12:30:00","endTime":"2023-11-04 13:00:00","length":1800,"description":"People and Power: The Launderer P3","long_description":"The concluding episode of a three part investigation into Mafia money laundering.","status":true,"channel":{"id":"7fd7a9a6-af32-c861-d2b0-4ddc7846fad2","key":"AljaInt","no":243,"name":"Al Jazeera International","slug":"al-jazeera-international","website":null,"description":"<p>An international 24-hour English-language It is the first English-language news channel brings you the latest global news stories, analysis from the Middle East &amp; worldwide.</p>","shortDescription":null,"logo":"files/logos/channels/11-NEWS/AlJazeera Int SD-FirstMedia-Chl-243.jpg","externalId":"132","type":"radio","status":true,"chanel":"SD","locale":"id","relationId":"5a6ea4ae-a008-4889-9c68-7a6f1838e81d","onlyfm":null,"genress":[{"id":"1db3bb43-b00d-49af-b272-6c058a8c0b49","name":"International Free View"},{"id":"2e81a4bd-9719-4186-820a-7e035e07be13","name":"News"}]}}]}}}'
  const results = parser({ content, channel })

  expect(results).toMatchObject([
    {
      start: '2023-11-04T05:30:00.000Z',
      stop: '2023-11-04T06:00:00.000Z',
      title: 'People and Power: The Launderer P3',
      description:
        "The concluding episode of a three part investigation into Mafia money laundering."
    }
  ])
})

it('can handle empty guide', () => {
  const results = parser({ content: '' })

  expect(results).toMatchObject([])
})
