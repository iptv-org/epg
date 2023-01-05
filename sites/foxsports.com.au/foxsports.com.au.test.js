// npx epg-grabber --config=sites/foxsports.com.au/foxsports.com.au.config.js --channels=sites/foxsports.com.au/foxsports.com.au.channels.xml --output=guide.xml --days=2

const { parser, url } = require('./foxsports.com.au.config.js')
const dayjs = require('dayjs')
const utc = require('dayjs/plugin/utc')
dayjs.extend(utc)

const date = dayjs.utc('2022-12-14', 'YYYY-MM-DD').startOf('d')
const channel = {
  site_id: '2',
  xmltv_id: 'FoxLeague.au'
}
it('can generate valid url', () => {
  expect(url({ date })).toBe(
    'https://tvguide.foxsports.com.au/granite-api/programmes.json?from=2022-12-14&to=2022-12-15'
  )
})

it('can parse response', () => {
  const content = `{"channel-programme":[{"id":"31cc8b4c-3711-49f0-bf22-2ec3993b0a07","programmeTitle":"NRL","title":"Eels v Titans","startTime":"2022-12-14T00:00:00+11:00","endTime":"2022-12-14T01:00:00+11:00","duration":60,"live":false,"genreId":"5c389cf4-8db7-4b52-9773-52355bd28559","channelId":2,"channelName":"FOX League","channelAbbreviation":"LEAGUE","programmeUID":235220,"round":"R1","statsMatchId":null,"closedCaptioned":true,"statsFixtureId":10207,"genreTitle":"Rugby League","parentGenreId":"a953f929-2d12-41a4-b0e9-97f401afff11","parentGenreTitle":"Sport","pmgId":"PMG01306944","statsSport":"league","type":"GAME","hiDef":true,"widescreen":true,"classification":"","synopsis":"The Eels and Titans have plenty of motivation this season after heartbreaking Finals losses in 2021. Parramatta has won their past five against Gold Coast.","preGameStartTime":null,"closeCaptioned":true}]}`

  const result = parser({ content, channel }).map(p => {
    p.start = p.start.toJSON()
    p.stop = p.stop.toJSON()
    return p
  })

  expect(result).toMatchObject([
    {
      title: 'NRL',
      sub_title: 'Eels v Titans',
      description: `The Eels and Titans have plenty of motivation this season after heartbreaking Finals losses in 2021. Parramatta has won their past five against Gold Coast.`,
      category: 'Rugby League',
      start: '2022-12-13T13:00:00.000Z',
      stop: '2022-12-13T14:00:00.000Z'
    }
  ])
})

it('can handle empty guide', () => {
  const result = parser(
    {
      content: `{"channel-programme":[]}`
    },
    channel
  )
  expect(result).toMatchObject([])
})
