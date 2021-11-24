// npx epg-grabber --config=sites/arianatelevision.com/arianatelevision.com.config.js --channels=sites/arianatelevision.com/arianatelevision.com_af.channels.xml --output=.gh-pages/guides/af/arianatelevision.com.epg.xml --days=2

const { parser, url, logo } = require('./arianatelevision.com.config.js')
const dayjs = require('dayjs')
const utc = require('dayjs/plugin/utc')
const customParseFormat = require('dayjs/plugin/customParseFormat')
dayjs.extend(customParseFormat)
dayjs.extend(utc)

const date = dayjs.utc('2021-11-27', 'YYYY-MM-DD').startOf('d')
const channel = {
  site_id: '#',
  xmltv_id: 'ArianaTVNational.af',
  logo: 'https://www.arianatelevision.com/wp-content/uploads/2017/08/logo-atn-new.png'
}

it('can generate valid url', () => {
  expect(url).toBe('https://www.arianatelevision.com/program-schedule/')
})

it('can generate valid logo url', () => {
  expect(logo({ channel })).toBe(
    'https://www.arianatelevision.com/wp-content/uploads/2017/08/logo-atn-new.png'
  )
})

it('can parse response', () => {
  const content = `<!DOCTYPE html><html><head></head><body><textarea data-jtrt-table-id="508" id="jtrt_table_settings_508" cols="30" rows="10">[[["Start","Saturday","Sunday","Monday","Tuesday","Wednesday","Thursday","Friday","",""],["7:00AM","City Report","ICC T20 Highlights","ICC T20 Highlights","ICC T20 Highlights","ICC T20 Highlights","ICC T20 Highlights","ICC T20 Highlights","",""],["7:30AM","ICC T20 Highlights","Sport ","Sport ","Sport ","Sport ","Sport ","Sport ","",""],["3:00PM","ICC T20 World Cup","ICC T20 World Cup","ICC T20 World Cup","ICC T20 World Cup","ICC T20 World Cup","ICC T20 World Cup","ICC T20 World Cup","",""],["6:30AM","Quran and Hadis ","Falah","Falah","Falah","Falah","Falah","Falah","",""],["","\\n","","","","","","","",""]]]</textarea></body></html>`
  const result = parser({ content, date }).map(p => {
    p.start = p.start.toJSON()
    p.stop = p.stop.toJSON()
    return p
  })

  expect(result).toMatchObject([
    {
      start: '2021-11-27T02:30:00.000Z',
      stop: '2021-11-27T03:00:00.000Z',
      title: `City Report`
    },
    {
      start: '2021-11-27T03:00:00.000Z',
      stop: '2021-11-27T10:30:00.000Z',
      title: `ICC T20 Highlights`
    },
    {
      start: '2021-11-27T10:30:00.000Z',
      stop: '2021-11-28T02:00:00.000Z',
      title: `ICC T20 World Cup`
    },
    {
      start: '2021-11-28T02:00:00.000Z',
      stop: '2021-11-28T02:30:00.000Z',
      title: `Quran and Hadis`
    }
  ])
})

it('can handle empty guide', () => {
  const result = parser({
    date,
    channel,
    content: `<!DOCTYPE html><html><head></head><body><textarea data-jtrt-table-id="508" id="jtrt_table_settings_508" cols="30" rows="10"></textarea></body></html>`
  })
  expect(result).toMatchObject([])
})
