// npm run channels:parse -- --config=./sites/horizon.tv/horizon.tv.config.js --output=./sites/horizon.tv/horizon.tv_de.channels.xml
// npx epg-grabber --config=sites/horizon.tv/horizon.tv.config.js --channels=sites/horizon.tv/horizon.tv_de.channels.xml --output=guide.xml --days=2

const { parser, url } = require('./horizon.tv.config.js')
const axios = require('axios')
const dayjs = require('dayjs')
const utc = require('dayjs/plugin/utc')
const customParseFormat = require('dayjs/plugin/customParseFormat')
dayjs.extend(customParseFormat)
dayjs.extend(utc)

jest.mock('axios')

const date = dayjs.utc('2022-03-09', 'YYYY-MM-DD').startOf('d')
const channel = {
  site_id: '123_tv',
  xmltv_id: '123tv.de'
}

it('can generate valid url', () => {
  expect(url({ date })).toBe(
    'https://legacy-static.oesp.horizon.tv/oesp/v4/DE/deu/web/programschedules/20220309/1'
  )
})

it('can parse response', done => {
  const content = `{"entries":[{"o":"lgi-obolite-de-prod-master:123_tv","l":[{"i":"crid:~~2F~~2Fmedia-press.tv~~2F265057185,imi:b6915913733f74d3d92ebdba58340d133fd5632b","t":"DuftGeheimnis","s":1646776800000,"e":1646780400000,"c":"lgi-obolite-de-prod-master:genre-18","a":false,"r":false,"rm":false,"ad":[],"sl":[]}]}]}`

  axios.get.mockImplementation(url => {
    if (
      url === 'https://legacy-static.oesp.horizon.tv/oesp/v4/DE/deu/web/programschedules/20220309/2'
    ) {
      return Promise.resolve({
        data: JSON.parse(
          `{"entries":[{"o":"lgi-obolite-de-prod-master:123_tv","l":[{"i":"crid:~~2F~~2Fmedia-press.tv~~2F263411037,imi:152c4e326ba8e52f91d10b28e4fd8544ff9cbade","t":"1-2-3.tv Morning-Deals","s":1646798400000,"e":1646802000000,"c":"lgi-obolite-de-prod-master:genre-18","a":false,"r":false,"rm":false,"ad":[],"sl":[]}]}]}`
        )
      })
    } else if (
      url === 'https://legacy-static.oesp.horizon.tv/oesp/v4/DE/deu/web/programschedules/20220309/3'
    ) {
      return Promise.resolve({
        data: JSON.parse(
          `{"entries":[{"o":"lgi-obolite-de-prod-master:123_tv","l":[{"i":"crid:~~2F~~2Fmedia-press.tv~~2F265166355,imi:2c61f3f21d3599e7b1f1aacdec066389688296a6","t":"Confiserie","s":1646820000000,"e":1646823600000,"c":"lgi-obolite-de-prod-master:genre-18","a":false,"r":false,"rm":false,"ad":[],"sl":[]}]}]}`
        )
      })
    } else if (
      url === 'https://legacy-static.oesp.horizon.tv/oesp/v4/DE/deu/web/programschedules/20220309/4'
    ) {
      return Promise.resolve({
        data: JSON.parse(
          `{"entries":[{"o":"lgi-obolite-de-prod-master:123_tv","l":[{"i":"crid:~~2F~~2Fmedia-press.tv~~2F265166350,imi:d8e2a799e061e6390f49bcf4f12df65f2c761bb6","t":"Sneaker World","s":1646841600000,"e":1646845200000,"c":"lgi-obolite-de-prod-master:genre-18","a":false,"r":false,"rm":false,"ad":[],"sl":[]}]}]}`
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
          start: '2022-03-08T22:00:00.000Z',
          stop: '2022-03-08T23:00:00.000Z',
          title: 'DuftGeheimnis'
        },
        {
          start: '2022-03-09T04:00:00.000Z',
          stop: '2022-03-09T05:00:00.000Z',
          title: '1-2-3.tv Morning-Deals'
        },
        {
          start: '2022-03-09T10:00:00.000Z',
          stop: '2022-03-09T11:00:00.000Z',
          title: 'Confiserie'
        },
        {
          start: '2022-03-09T16:00:00.000Z',
          stop: '2022-03-09T17:00:00.000Z',
          title: 'Sneaker World'
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
