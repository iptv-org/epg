// node ./scripts/channels.js --config=./sites/rev.bs/rev.bs.config.js --output=./sites/rev.bs/rev.bs.channels.xml
// npx epg-grabber --config=sites/rev.bs/rev.bs.config.js --channels=sites/rev.bs/rev.bs.channels.xml --output=guide.xml --days=2

const { parser, url } = require('./rev.bs.config.js')
const axios = require('axios')
const dayjs = require('dayjs')
const utc = require('dayjs/plugin/utc')
const customParseFormat = require('dayjs/plugin/customParseFormat')

dayjs.extend(customParseFormat)
dayjs.extend(utc)

jest.mock('axios')

const date = dayjs.utc('2021-11-21', 'YYYY-MM-DD').startOf('d')
const channel = {
  site_id: '206',
  xmltv_id: 'WTVJ.us'
}

it('can generate valid url', () => {
  expect(url({ date, channel })).toBe(
    'https://www.rev.bs/wp-content/uploads/tv-guide/2021-11-21_0.json'
  )
})

it('can parse response', done => {
  axios.get.mockImplementation(url => {
    if (url === 'https://www.rev.bs/wp-content/uploads/tv-guide/2021-11-21_1.json') {
      return Promise.resolve({
        data: Buffer.from(
          `{"status":"OK","data":{"schedule":{"206":[{"title":"Talk Stoop","sid":43599836,"s":"330.0000","duration":30,"rating":"TVPG"}]}}}`
        )
      })
    } else {
      return Promise.resolve({
        data: Buffer.from(`{"status":"OK","data":{"schedule":{}}}`)
      })
    }
  })

  const content = `{"status":"OK","data":{"schedule":{"205":[{"title":"Rev Pulse 5 - Online Classifieds","sid":43576112,"s":"-120.0000","duration":120,"rating":""}],"206":[{"title":"Saturday Night Live","sid":43599827,"s":"-31.0000","duration":93,"rating":"TV14"}]}}}`
  parser({ content, channel, date })
    .then(result => {
      result = result.map(p => {
        p.start = p.start.toJSON()
        p.stop = p.stop.toJSON()
        return p
      })
      expect(result).toMatchObject([
        {
          start: '2021-11-21T04:29:00.000Z',
          stop: '2021-11-21T06:02:00.000Z',
          title: `Saturday Night Live`
        },
        {
          start: '2021-11-21T10:30:00.000Z',
          stop: '2021-11-21T11:00:00.000Z',
          title: `Talk Stoop`
        }
      ])
      done()
    })
    .catch(err => {
      done(err)
    })
})

it('can handle empty guide', done => {
  parser({
    date,
    channel,
    content: `<html lang="en"><head></head><body></body></html>`
  })
    .then(result => {
      expect(result).toMatchObject([])
      done()
    })
    .catch(err => {
      done(err)
    })
})
