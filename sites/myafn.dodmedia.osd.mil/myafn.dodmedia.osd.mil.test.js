// npx epg-grabber --config=sites/myafn.dodmedia.osd.mil/myafn.dodmedia.osd.mil.config.js --channels=sites/myafn.dodmedia.osd.mil/myafn.dodmedia.osd.mil.channels.xml --output=guide.xml --days=2
// npm run channels:parse -- --config=./sites/myafn.dodmedia.osd.mil/myafn.dodmedia.osd.mil.config.js --output=./sites/myafn.dodmedia.osd.mil/myafn.dodmedia.osd.mil.channels.xml

const { parser, url } = require('./myafn.dodmedia.osd.mil.config.js')
const dayjs = require('dayjs')
const utc = require('dayjs/plugin/utc')
const customParseFormat = require('dayjs/plugin/customParseFormat')
dayjs.extend(customParseFormat)
dayjs.extend(utc)

const date = dayjs.utc('2022-10-03', 'YYYY-MM-DD').startOf('d')
const channel = {
  site_id: '2',
  xmltv_id: 'AFNPrimeAtlantic.us'
}

it('can generate valid url', () => {
  expect(url({ date })).toBe(
    'https://v3.myafn.dodmedia.osd.mil/api/json/32/2022-10-03@0000/2022-10-03@2359/schedule.json'
  )
})

it('can parse response', () => {
  const content = `[{"a":566,"b":2,"c":"2022,9,3,3,0,0,0","d":"2022,9,3,4,0,0,0","e":"2022,9,3,3,0,0,0","f":"2022,9,3,4,0,0,0","g":60,"h":"This Week with George Stephanopoulos (ABC)","i":"Episode Title","j":"TV-14","k":false,"l":"Former Clinton White House staffer and current co-anchor of ABC's weekday morning news show \\"\\"Good Morning America,\\"\\" George Stephanopoulos and co-anchors Martha Raddatz and Jonathan Karl offer a look at current events with a focus on the politics of the day. Each week's show includes interviews with top newsmakers (including some of the nation's top political leaders) as well as a roundtable discussion, usually featuring journalists from ABC and other news organizations, of the week's happenings. Since 2008, the program has broadcast from a studio at the Newseum in Washington, D.C.","m":"News,Politics,Public affairs,Talk","n":694284445,"o":60,"p":20,"q":true,"r":694285705,"s":null}]`
  const result = parser({ content, date, channel }).map(p => {
    p.start = p.start.toJSON()
    p.stop = p.stop.toJSON()
    return p
  })

  expect(result).toMatchObject([
    {
      start: '2022-10-03T03:00:00.000Z',
      stop: '2022-10-03T04:00:00.000Z',
      title: 'This Week with George Stephanopoulos (ABC)',
      sub_title: 'Episode Title',
      description:
        'Former Clinton White House staffer and current co-anchor of ABC\'s weekday morning news show ""Good Morning America,"" George Stephanopoulos and co-anchors Martha Raddatz and Jonathan Karl offer a look at current events with a focus on the politics of the day. Each week\'s show includes interviews with top newsmakers (including some of the nation\'s top political leaders) as well as a roundtable discussion, usually featuring journalists from ABC and other news organizations, of the week\'s happenings. Since 2008, the program has broadcast from a studio at the Newseum in Washington, D.C.',
      category: ['News', 'Politics', 'Public affairs', 'Talk'],
      rating: {
        system: 'MPA',
        value: 'TV-14'
      }
    }
  ])
})

it('can handle empty guide', () => {
  const result = parser({
    content: `{
      "Message": "An error has occurred."
    }`,
    date,
    channel
  })
  expect(result).toMatchObject([])
})
