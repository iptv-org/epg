// node ./scripts/channels.js --config=./sites/tvarenasport.com/tvarenasport.com.config.js --output=./sites/tvarenasport.com/tvarenasport.com.channels.xml --set=country:rs
// npx epg-grabber --config=sites/tvarenasport.com/tvarenasport.com.config.js --channels=sites/tvarenasport.com/tvarenasport.com.channels.xml --output=guide.xml --days=2

const { parser, url } = require('./tvarenasport.com.config.js')
const dayjs = require('dayjs')
const utc = require('dayjs/plugin/utc')
const customParseFormat = require('dayjs/plugin/customParseFormat')
dayjs.extend(customParseFormat)
dayjs.extend(utc)

const date = dayjs.utc('2021-11-17', 'YYYY-MM-DD').startOf('d')
const channel = {
  site_id: '380',
  xmltv_id: 'ArenaSport1.rs'
}

it('can generate valid url', () => {
  expect(url({ channel, date })).toBe('https://www.tvarenasport.com/api/schedule?date=17-11-2021')
})

it('can parse response', () => {
  const content = `{"items":[{"id":2857,"title":"Crvena zvezda mts - Partizan NIS","start":"2021-11-16T23:30:00Z","end":"2021-11-17T01:30:00Z","sport":"ABA LIGA","league":"Ko\u0161arka","group":"380","isLive":false,"doNotMiss":false,"domain":"srb"},{"id":3155,"title":"Sao Paulo - Flamengo","start":"2021-11-17T00:00:00Z","end":"2021-11-17T02:00:00Z","sport":"BRAZILSKA LIGA","league":"Fudbal","group":"381","isLive":false,"doNotMiss":false,"domain":"srb"}]}`
  const result = parser({ channel, content }).map(p => {
    p.start = p.start.toJSON()
    p.stop = p.stop.toJSON()
    return p
  })

  expect(result).toMatchObject([
    {
      start: '2021-11-16T23:30:00.000Z',
      stop: '2021-11-17T01:30:00.000Z',
      title: 'Crvena zvezda mts - Partizan NIS',
      category: 'Ko\u0161arka',
      description: 'ABA LIGA'
    }
  ])
})

it('can handle empty guide', () => {
  const result = parser({
    date,
    channel,
    content: `{"channels":[]}`
  })
  expect(result).toMatchObject([])
})
