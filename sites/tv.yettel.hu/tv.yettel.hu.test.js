// npm run channels:parse -- --config=./sites/tv.yettel.hu/tv.yettel.hu.config.js --output=./sites/tv.yettel.hu/tv.yettel.hu.channels.xml
// npx epg-grabber --config=sites/tv.yettel.hu/tv.yettel.hu.config.js --channels=sites/tv.yettel.hu/tv.yettel.hu.channels.xml --output=guide.xml --days=2

const { parser, url } = require('./tv.yettel.hu.config.js')
const dayjs = require('dayjs')
const utc = require('dayjs/plugin/utc')
const customParseFormat = require('dayjs/plugin/customParseFormat')
dayjs.extend(customParseFormat)
dayjs.extend(utc)

const date = dayjs.utc('2022-06-17', 'YYYY-MM-DD').startOf('d')
const channel = {
  site_id: 'LCH1',
  xmltv_id: 'M1.hu'
}

it('can generate valid url', () => {
  expect(url({ channel, date })).toBe(
    'https://dev.mytvback.com/api/19/default/hu-HU/schedules?livechannelpids=LCH1&includeImages=cover%3A100%3A144&filterAvailability=false&startTime=1655424000&endTime=1655510400'
  )
})

it('can parse response', () => {
  const content = `{
  "Content": [
    {
      "AgeRatingPid": "",
      "catchup_days": "0",
      "AvailableUntil": 1655445600,
      "Description": "",
      "End": 1655445600,
      "LiveChannelPid": "LCH1",
      "ch_id": "1",
      "LiveProgramPid": "LEP3906574",
      "pr_id": "3906574",
      "se_id": "13986",
      "LiveSeriesPid": "LSE13986",
      "Pid": "LSC17202373",
      "id": "17202373",
      "Rating": 0,
      "RatingTotalVotes": 0,
      "ShortDescription": "A Ma reggel az MTVA saját gyártású, minden hétköznap jelentkező reggeli politikai és közéleti témákkal foglalkozó műsora.",
      "Start": 1655443980,
      "Title": "Ma reggel",
      "Year": 2022,
      "GenrePids": [
        "GEN184"
      ],
      "ge_id": "184",
      "IsCatchup": "1",
      "ChannelIsCatchup": "0",
      "Images": {
        "Cover": [
          {
            "Url": "https://static.mytvback.com/userfiles/c/0/c01d48a36b913a7afb0dcb5edba33849_thum_100x144.jpg"
          }
        ]
      }
    }]}`
  const result = parser({ content }).map(p => {
    p.start = p.start.toJSON()
    p.stop = p.stop.toJSON()
    return p
  })

  expect(result).toMatchObject([
    {
      start: '2022-06-17T05:33:00.000Z',
      stop: '2022-06-17T06:00:00.000Z',
      title: 'Ma reggel',
      description:
        'A Ma reggel az MTVA saját gyártású, minden hétköznap jelentkező reggeli politikai és közéleti témákkal foglalkozó műsora.',
      icon: 'https://static.mytvback.com/userfiles/c/0/c01d48a36b913a7afb0dcb5edba33849_thum_100x144.jpg'
    }
  ])
})

it('can handle empty guide', () => {
  const result = parser({
    content: `{"Content":[],"HttpStatusCode":200,"StatusCode":0,"StatusMessage":"OK","Severity":1}`
  })
  expect(result).toMatchObject([])
})
