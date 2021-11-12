// npx epg-grabber --config=sites/mncvision.id/mncvision.id.config.js --channels=sites/mncvision.id/mncvision.id_id.channels.xml --output=.gh-pages/guides/id/mncvision.id.epg.xml --days=2

const { parser, url, request, logo } = require('./mncvision.id.config.js')
const axios = require('axios')
const dayjs = require('dayjs')
const utc = require('dayjs/plugin/utc')
const customParseFormat = require('dayjs/plugin/customParseFormat')
dayjs.extend(customParseFormat)
dayjs.extend(utc)

jest.mock('axios')

const date = dayjs.utc('2021-11-12', 'YYYY-MM-DD').startOf('d')
const channel = {
  site_id: '203',
  xmltv_id: 'AnimalPlanetSoutheastAsia.us'
}
const content = `<!DOCTYPE html><html lang="en"><head></head><body> <table class="table table-striped table-bordered table-hover table-condensed" cellspacing="0" cellpadding="0" border="0"> <tr> <th width='10%'>Jam Tayang</th> <th width='80%' align='left'>Program Acara</th> <th width='10%'>Durasi</th> </tr><tr valign="top"> <td class="text-center">00:00</td><td><a href="https://mncvision.id/schedule/detail/20211112000000203/African-Wild-S1-Seals/1" title="African Wild S1: Seals" rel="facebox">African Wild S1: Seals</a></td><td class="text-center">01:00</td></tr></table></body></html>`

it('can generate valid url', () => {
  expect(url).toBe('https://mncvision.id/schedule/table')
})

it('can generate valid request headers', () => {
  expect(request.headers).toMatchObject({
    'Content-Type': 'multipart/form-data; boundary=X-EPG-BOUNDARY'
  })
})

it('can generate valid request data', () => {
  const result = request.data({ channel, date })
  expect(result._boundary).toBe('X-EPG-BOUNDARY')
})

it('can get logo url', () => {
  expect(logo({ content, channel })).toBe(
    'https://www.mncvision.id/userfiles/image/channel/channel_203.png'
  )
})

it('can parse response', done => {
  axios.get.mockImplementation(() =>
    Promise.resolve({
      data: `<!DOCTYPE html><html lang="en"><head></head><body><blockquote class="bloquet synopsis">
      Nikmati suasana kehidupan koloni anjing laut di kawasan pantai barat Afrika Selatan.    </blockquote></body></html>`
    })
  )

  parser({ date, channel, content })
    .then(result => {
      expect(result).toMatchObject([
        {
          start: '2021-11-11T17:00:00.000Z',
          stop: '2021-11-11T18:00:00.000Z',
          title: 'African Wild S1: Seals',
          description:
            'Nikmati suasana kehidupan koloni anjing laut di kawasan pantai barat Afrika Selatan.'
        }
      ])
      done()
    })
    .catch(error => {
      done(error)
    })
})

it('can handle empty guide', done => {
  parser({
    date,
    channel,
    content: `<!DOCTYPE html><html lang="en"><head></head><body></body></html>`
  })
    .then(result => {
      expect(result).toMatchObject([])
      done()
    })
    .catch(error => {
      done(error)
    })
})
