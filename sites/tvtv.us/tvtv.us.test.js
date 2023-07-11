// npx epg-grabber --config=sites/tvtv.us/tvtv.us.config.js --channels=sites/tvtv.us/tvtv.us.channels.xml --output=guide.xml

const { parser, url } = require('./tvtv.us.config.js')
const dayjs = require('dayjs')
const utc = require('dayjs/plugin/utc')
const customParseFormat = require('dayjs/plugin/customParseFormat')
dayjs.extend(customParseFormat)
dayjs.extend(utc)

const date = dayjs.utc('2022-09-20', 'YYYY-MM-DD').startOf('d')
const channel = {
  site_id: '62670',
  xmltv_id: 'AMITV.ca',
  logo: 'https://tvtv.us/gn/i/assets/s62670_ll_h15_ab.png?w=360&h=270'
}

it('can generate valid url', () => {
  expect(url({ channel, date })).toBe(
    'https://www.tvtv.us/api/v1/lineup/USA-NY71652-DEFAULT/grid/2022-09-20T00:00:00.000Z/2022-09-21T00:00:00.000Z/62670'
  )
})

it('can parse response', () => {
  const content = `[[{"programId":"EP039131940001","title":"Beyond the Field","subtitle":"Diversity in Sport","flags":["CC","DVS"],"type":"O","startTime":"2022-09-20T00:00Z","start":0,"duration":30,"runTime":30},{"programId":"EP032368970002","title":"IGotThis","subtitle":"Listen to Dis","flags":["CC","DVS"],"type":"O","startTime":"2022-09-20T00:30Z","start":120,"duration":30,"runTime":30}]]`

  const result = parser({ content }).map(p => {
    p.start = p.start.toJSON()
    p.stop = p.stop.toJSON()
    return p
  })

  expect(result).toMatchObject([
    {
      start: '2022-09-20T00:00:00.000Z',
      stop: '2022-09-20T00:30:00.000Z',
      title: 'Beyond the Field',
      description: `Diversity in Sport`
    },
    {
      start: '2022-09-20T00:30:00.000Z',
      stop: '2022-09-20T01:00:00.000Z',
      title: 'IGotThis',
      description: `Listen to Dis`
    }
  ])
})

it('can handle empty guide', () => {
  const result = parser({
    content: `[]`
  })
  expect(result).toMatchObject([])
})
