// node ./scripts/channels.js --config=./sites/mncvision.id/mncvision.id.config.js --output=./sites/mncvision.id/mncvision.id_id.channels.xml
// npx epg-grabber --config=sites/mncvision.id/mncvision.id.config.js --channels=sites/mncvision.id/mncvision.id_id-id.channels.xml --output=guide.xml --days=2
// npx epg-grabber --config=sites/mncvision.id/mncvision.id.config.js --channels=sites/mncvision.id/mncvision.id_id-en.channels.xml --output=guide.xml --days=2

const { parser, url, request } = require('./mncvision.id.config.js')
const axios = require('axios')
const dayjs = require('dayjs')
const utc = require('dayjs/plugin/utc')
const customParseFormat = require('dayjs/plugin/customParseFormat')
dayjs.extend(customParseFormat)
dayjs.extend(utc)

jest.mock('axios')

const date = dayjs.utc('2021-11-12', 'YYYY-MM-DD').startOf('d')
const channelID = {
  site_id: '203',
  xmltv_id: 'AnimalPlanetSoutheastAsia.us',
  lang: 'id'
}
const channelEN = {
  site_id: '203',
  xmltv_id: 'AnimalPlanetSoutheastAsia.us',
  lang: 'en'
}

const content0 = `<!DOCTYPE html><html lang="en"> <head></head> <body> <div id="id-content-schedule-table" class="lang-indonesia tm-content-container"> <div class="container content-schedule-table"> <h1 class="page-header tm">Jadwal Tayang Cari</h1> <div id="schedule" class="schedule_table panel tm tm-block tm-block-1"> <div class="schedule_search_result_container"> <div class='schedule_search_desc_container'><span class="subpage-title">Jadwal Tayang</span> Channel: <span class='label label-default'>41</span> Tanggal: <span class='label label-default'>2022-03-05</span></div><table class="table table-striped table-bordered table-hover table-condensed" cellspacing="0" cellpadding="0" border="0"> <tr> <th width='10%'>Jam Tayang</th> <th width='80%' align='left'>Program Acara</th> <th width='10%'>Durasi</th> </tr><tr valign="top"> <td class="text-center">00:00</td><td><a href="https://www.mncvision.id/schedule/detail/2022030500000041/Hey-Duggee-S3-Ep-22/1" title="Hey Duggee S3, Ep 22" rel="facebox">Hey Duggee S3, Ep 22</a></td><td class="text-center">00:07</td></tr></table> <div align="center" class="box well">page: <strong>1</strong><a href="https://www.mncvision.id/schedule/table/startno/50" data-ci-pagination-page="2">2</a><a href="https://www.mncvision.id/schedule/table/startno/50" data-ci-pagination-page="2" rel="next">&gt;</a></div></div></div></div></div></body></html>`
const content50 = `<!DOCTYPE html><html lang="en"> <head></head> <body> <div id="id-content-schedule-table" class="lang-indonesia tm-content-container"> <div class="container content-schedule-table"> <h1 class="page-header tm">Jadwal Tayang Cari</h1> <div id="schedule" class="schedule_table panel tm tm-block tm-block-1"> <div class="schedule_search_result_container"> <div class='schedule_search_desc_container'><span class="subpage-title">Jadwal Tayang</span> Channel: <span class='label label-default'>41</span> Tanggal: <span class='label label-default'>2022-03-05</span></div><table class="table table-striped table-bordered table-hover table-condensed" cellspacing="0" cellpadding="0" border="0"> <tr> <th width='10%'>Jam Tayang</th> <th width='80%' align='left'>Program Acara</th> <th width='10%'>Durasi</th> </tr><tr valign="top"> <td class="text-center">08:25</td><td><a href="https://www.mncvision.id/schedule/detail/2022030508250041/Hey-Duggee-S1-Ep-46/1" title="Hey Duggee S1, Ep 46" rel="facebox">Hey Duggee S1, Ep 46</a></td><td class="text-center">00:07</td></tr></table> <div align="center" class="box well">page: <a href="https://www.mncvision.id/schedule/table/startno/" data-ci-pagination-page="1" rel="prev">&lt;</a><a href="https://www.mncvision.id/schedule/table/startno/" data-ci-pagination-page="1" rel="start">1</a><strong>2</strong><a href="https://www.mncvision.id/schedule/table/startno/100" data-ci-pagination-page="3" rel="next">&gt;</a></div></div></div></div></div></body></html>`

it('can generate valid url', () => {
  expect(url).toBe('https://mncvision.id/schedule/table')
})

it('can generate valid request headers', () => {
  expect(request.headers).toMatchObject({
    'Content-Type': 'multipart/form-data; boundary=X-EPG-BOUNDARY'
  })
})

it('can generate valid request data', () => {
  const result = request.data({ channel: channelID, date })
  expect(result._boundary).toBe('X-EPG-BOUNDARY')
})

it('can parse response in Indonesian', done => {
  const setCookie = [
    's1nd0vL=0qpsmm7dpjmi7nt8d2h5epf16rmgg8a8; expires=Sat, 05-Mar-2022 15:44:22 GMT; Max-Age=7200; path=/; HttpOnly'
  ]

  axios.get.mockImplementation((url, options = {}) => {
    if (
      url === 'https://www.mncvision.id/schedule/detail/2022030500000041/Hey-Duggee-S3-Ep-22/1' &&
      options.headers &&
      options.headers['X-Requested-With'] === 'XMLHttpRequest' &&
      options.headers['Cookie'] === setCookie.join(';')
    ) {
      return Promise.resolve({
        data: `<!DOCTYPE html><html lang="en"><head></head><body><blockquote class="bloquet synopsis">
      Nikmati suasana kehidupan koloni anjing laut di kawasan pantai barat Afrika Selatan.    </blockquote></body></html>`
      })
    } else if (
      url === 'https://www.mncvision.id/schedule/table/startno/50' &&
      options.headers &&
      options.headers['Cookie'] === setCookie.join(';')
    ) {
      return Promise.resolve({
        data: content50
      })
    }

    return Promise.resolve({ data: '' })
  })

  parser({ date, content: content0, headers: { 'set-cookie': setCookie }, channel: channelID })
    .then(result => {
      result = result.map(p => {
        p.start = p.start.toJSON()
        p.stop = p.stop.toJSON()
        return p
      })

      expect(result).toMatchObject([
        {
          start: '2021-11-11T17:00:00.000Z',
          stop: '2021-11-11T17:07:00.000Z',
          title: 'Hey Duggee S3, Ep 22',
          description:
            'Nikmati suasana kehidupan koloni anjing laut di kawasan pantai barat Afrika Selatan.'
        },
        {
          start: '2021-11-12T01:25:00.000Z',
          stop: '2021-11-12T01:32:00.000Z',
          title: 'Hey Duggee S1, Ep 46',
          description: null
        }
      ])
      done()
    })
    .catch(error => {
      done(error)
    })
})

it('can parse response in English', done => {
  const setCookie = [
    's1nd0vL=0qpsmm7dpjmi7nt8d2h5epf16rmgg8a8; expires=Sat, 05-Mar-2022 15:44:22 GMT; Max-Age=7200; path=/; HttpOnly'
  ]

  axios.get.mockImplementation((url, options = {}) => {
    if (
      url === 'https://www.mncvision.id/schedule/detail/2022030500000041/Hey-Duggee-S3-Ep-22/1' &&
      options.headers &&
      options.headers['X-Requested-With'] === 'XMLHttpRequest' &&
      options.headers['Cookie'] === setCookie.join(';')
    ) {
      return Promise.resolve({
        data: `<!DOCTYPE html><html lang="en"><head></head><body><blockquote class="bloquet synopsis">
      While Castiel investigates the disappearance of a local teen, Sam and Dean are visited by an old friend.    </blockquote></body></html>`
      })
    } else if (
      url === 'https://www.mncvision.id/schedule/table/startno/50' &&
      options.headers &&
      options.headers['Cookie'] === setCookie.join(';')
    ) {
      return Promise.resolve({
        data: content50
      })
    }

    return Promise.resolve({ data: '' })
  })

  parser({ date, content: content0, headers: { 'set-cookie': setCookie }, channel: channelEN })
    .then(result => {
      result = result.map(p => {
        p.start = p.start.toJSON()
        p.stop = p.stop.toJSON()
        return p
      })

      expect(result).toMatchObject([
        {
          start: '2021-11-11T17:00:00.000Z',
          stop: '2021-11-11T17:07:00.000Z',
          title: 'Hey Duggee S3, Ep 22',
          description:
            'While Castiel investigates the disappearance of a local teen, Sam and Dean are visited by an old friend.'
        },
        {
          start: '2021-11-12T01:25:00.000Z',
          stop: '2021-11-12T01:32:00.000Z',
          title: 'Hey Duggee S1, Ep 46',
          description: null
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
    channel: channelID,
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
