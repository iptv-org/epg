// node ./scripts/commands/parse-channels.js --config=./sites/guide.dstv.com/guide.dstv.com.config.js --output=./sites/guide.dstv.com/guide.dstv.com.channels.xml --set=bouquet:c35aaecd-5dd1-480b-ae24-357e600a0e4d
// npx epg-grabber --config=sites/guide.dstv.com/guide.dstv.com.config.js --channels=sites/guide.dstv.com/guide.dstv.com.channels.xml --output=guide.xml --timeout=30000 --days=2

const { parser, url } = require('./guide.dstv.com.config.js')
const dayjs = require('dayjs')
const utc = require('dayjs/plugin/utc')
const customParseFormat = require('dayjs/plugin/customParseFormat')
dayjs.extend(customParseFormat)
dayjs.extend(utc)

const date = dayjs.utc('2021-11-24', 'YYYY-MM-DD').startOf('d')
const channel = {
  site_id: 'b0dc42b8-c651-4c3c-8713-a7fcd04744ee#M4H',
  xmltv_id: 'MNetMovies4.za'
}

it('can generate valid url', () => {
  const result = url({ date, channel })
  expect(result).toBe(
    'https://guide.dstv.com/api/gridview/page?bouquetId=b0dc42b8-c651-4c3c-8713-a7fcd04744ee&genre=all&date=2021-11-24'
  )
})

it('can parse response', () => {
  const content = `{"M4H": "        <li schedule-id=7be16b76-51fa-4c73-9e85-3b94993cd6ff style='width:540px; left:-35460px'>            <a class='event' analytics-id=\\"eventOpenEvent\\" analytics-text=\\"Deadly Flight\\">                                    <p class='event-time'>                        21:30                                            </p>                    <p class='event-title'>Deadly Flight</p>                            </a>        </li>      <li schedule-id=7e156af9-005a-4308-b91f-5d45b6fd04e6 style='width:720px; left:-31530px'>            <a class='event' analytics-id=\\"eventOpenEvent\\" analytics-text=\\"I Still Believe\\">                                    <p class='event-time'>                        08:25                                            </p>                    <p class='event-title'>I Still Believe</p>                            </a>        </li>      <li schedule-id=0464d009-ed1e-4b1d-8282-c2464123ac5a style='width:570px; left:-28860px'>            <a class='event' analytics-id=\\"eventOpenEvent\\" analytics-text=\\"Despicable Me\\">                                    <p class='event-time'>                        15:50                                            </p>                    <p class='event-title'>Despicable Me</p>                            </a>        </li>      <li schedule-id=7d346d4d-40e1-4177-83a1-56c173c008e2 style='width:690px; left:-27150px'>            <a class='event' analytics-id=\\"eventOpenEvent\\" analytics-text=\\"The Foreigner\\">                                    <p class='event-time'>                        20:35                                            </p>                    <p class='event-title'>The Foreigner</p>                            </a>        </li>    "}`
  const result = parser({ date, channel, content }).map(p => {
    p.start = p.start.toJSON()
    p.stop = p.stop.toJSON()
    return p
  })
  expect(result).toMatchObject([
    {
      start: '2021-11-23T21:30:00.000Z',
      stop: '2021-11-24T08:25:00.000Z',
      title: 'Deadly Flight'
    },
    {
      start: '2021-11-24T08:25:00.000Z',
      stop: '2021-11-24T15:50:00.000Z',
      title: 'I Still Believe'
    },
    {
      start: '2021-11-24T15:50:00.000Z',
      stop: '2021-11-24T20:35:00.000Z',
      title: 'Despicable Me'
    },
    {
      start: '2021-11-24T20:35:00.000Z',
      stop: '2021-11-24T21:35:00.000Z',
      title: 'The Foreigner'
    }
  ])
})

it('can handle empty guide', () => {
  const result = parser({ date, channel, content: `{}` })
  expect(result).toMatchObject([])
})
