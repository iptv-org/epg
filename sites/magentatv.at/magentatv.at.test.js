// npm run channels:parse -- --config=./sites/magentatv.at/magentatv.at.config.js --output=./sites/magentatv.at/magentatv.at_at.channels.xml
// npx epg-grabber --config=sites/magentatv.at/magentatv.at.config.js --channels=sites/magentatv.at/magentatv.at_at.channels.xml --output=guide.xml --days=2

const { parser, url } = require('./magentatv.at.config.js')
const axios = require('axios')
const dayjs = require('dayjs')
const utc = require('dayjs/plugin/utc')
const customParseFormat = require('dayjs/plugin/customParseFormat')
dayjs.extend(customParseFormat)
dayjs.extend(utc)

jest.mock('axios')

const date = dayjs.utc('2022-03-09', 'YYYY-MM-DD').startOf('d')
const channel = {
  site_id: '13TH_Street_HD',
  xmltv_id: '13thStreetDeutschland.us'
}

it('can generate valid url', () => {
  expect(url({ date })).toBe(
    'https://prod.oesp.magentatv.at/oesp/v4/AT/deu/web/programschedules/20220309/1'
  )
})

it('can parse response', done => {
  const content = `{"entries":[{"o":"lgi-at-prodobo-master:13TH_Street_HD","l":[{"i":"crid:~~2F~~2Fbds.tv~~2F1870513,imi:c83a0bf1b04d6610d0517e63647772c1c8725693","t":"Law & Order: Special Victims Unit","s":1646778600000,"e":1646781300000,"c":"lgi-at-prodobo-master:genre-9","a":false,"r":false,"rm":false,"ad":[],"sl":[]}]}]}`

  axios.get.mockImplementation(url => {
    if (url === 'https://prod.oesp.magentatv.at/oesp/v4/AT/deu/web/programschedules/20220309/2') {
      return Promise.resolve({
        data: JSON.parse(
          `{"entries":[{"o":"lgi-at-prodobo-master:13TH_Street_HD","l":[{"i":"crid:~~2F~~2Fmedia-press.tv~~2F217048123,imi:ee14cfe306cb50502b03c96d58851c32345a9391","t":"FBI: Special Crime Unit","s":1646781300000,"e":1646784000000,"c":"lgi-at-prodobo-master:genre-9","a":false,"r":false,"rm":false,"ad":[],"sl":[]}]}]}`
        )
      })
    } else if (
      url === 'https://prod.oesp.magentatv.at/oesp/v4/AT/deu/web/programschedules/20220309/3'
    ) {
      return Promise.resolve({
        data: JSON.parse(
          `{"entries":[{"o":"lgi-at-prodobo-master:13TH_Street_HD","l":[{"i":"crid:~~2F~~2Fmedia-press.tv~~2F224431085,imi:805c5a9b6610edb65cdff319a9b080ab5f65a6c8","t":"FBI: Special Crime Unit","s":1646784000000,"e":1646786700000,"c":"lgi-at-prodobo-master:genre-9","a":false,"r":false,"rm":false,"ad":[],"sl":[]}]}]}`
        )
      })
    } else if (
      url === 'https://prod.oesp.magentatv.at/oesp/v4/AT/deu/web/programschedules/20220309/4'
    ) {
      return Promise.resolve({
        data: JSON.parse(
          `{"entries":[{"o":"lgi-at-prodobo-master:13TH_Street_HD","l":[{"i":"crid:~~2F~~2Fbds.tv~~2F918961,imi:f27353bf910e8849d60e0381fdb2d1f7518ef7a2","t":"Law & Order","s":1646786700000,"e":1646789400000,"c":"lgi-at-prodobo-master:genre-9","a":false,"r":false,"rm":false,"ad":[],"sl":[]}]}]}`
        )
      })
    } else {
      return Promise.resolve({ data: '' })
    }
  })

  parser({ content, channel, date })
    .then(result => {
      result = result.map(p => {
        p.start = p.start.toJSON()
        p.stop = p.stop.toJSON()
        return p
      })

      expect(result).toMatchObject([
        {
          start: '2022-03-08T22:30:00.000Z',
          stop: '2022-03-08T23:15:00.000Z',
          title: 'Law & Order: Special Victims Unit'
        },
        {
          start: '2022-03-08T23:15:00.000Z',
          stop: '2022-03-09T00:00:00.000Z',
          title: 'FBI: Special Crime Unit'
        },
        {
          start: '2022-03-09T00:00:00.000Z',
          stop: '2022-03-09T00:45:00.000Z',
          title: 'FBI: Special Crime Unit'
        },
        {
          start: '2022-03-09T00:45:00.000Z',
          stop: '2022-03-09T01:30:00.000Z',
          title: 'Law & Order'
        }
      ])
      done()
    })
    .catch(done)
})

it('can handle empty guide', done => {
  parser({
    content: `[{"type":"PATH_PARAM","code":"period","reason":"INVALID"}]`,
    channel,
    date
  })
    .then(result => {
      expect(result).toMatchObject([])
      done()
    })
    .catch(done)
})
