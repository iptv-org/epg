// node ./scripts/channels.js --config=./sites/tvarenasport.hr/tvarenasport.hr.config.js --output=./sites/tvarenasport.hr/tvarenasport.hr.channels.xml
// npx epg-grabber --config=sites/tvarenasport.hr/tvarenasport.hr.config.js --channels=sites/tvarenasport.hr/tvarenasport.hr.channels.xml --output=guide.xml --days=2

const { parser, url } = require('./tvarenasport.hr.config.js')
const dayjs = require('dayjs')
const utc = require('dayjs/plugin/utc')
const customParseFormat = require('dayjs/plugin/customParseFormat')
dayjs.extend(customParseFormat)
dayjs.extend(utc)

const date = dayjs.utc('2021-11-17', 'YYYY-MM-DD').startOf('d')
const channel = {
  site_id: '380',
  xmltv_id: 'ArenaSport1Croatia.hr'
}

it('can generate valid url', () => {
  expect(url({ channel, date })).toBe('https://www.tvarenasport.hr/api/schedule?date=17-11-2021')
})

it('can parse response', () => {
  const content = `{"items":[{"id":6104,"title":"NAJAVA PROGRAMA","start":"2021-11-16T23:00:00Z","end":"2021-11-17T23:00:00Z","sport":"Najava programa","league":"NAJAVA PROGRAMA","group":"1294","isLive":false,"doNotMiss":false,"domain":"cro"},{"id":6000,"title":" DIJON - UNICAJA","start":"2021-11-16T23:30:00Z","end":"2021-11-17T01:00:00Z","sport":"Košarka","league":" LIGA PRVAKA","group":"380","isLive":false,"doNotMiss":false,"domain":"cro"}]}`
  const result = parser({ channel, content }).map(p => {
    p.start = p.start.toJSON()
    p.stop = p.stop.toJSON()
    return p
  })

  expect(result).toMatchObject([
    {
      start: '2021-11-16T23:30:00.000Z',
      stop: '2021-11-17T01:00:00.000Z',
      title: 'DIJON - UNICAJA',
      category: 'Košarka',
      description: 'LIGA PRVAKA'
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
