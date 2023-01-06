// npx epg-grabber --config=sites/rtb.gov.bn/rtb.gov.bn.config.js --channels=sites/rtb.gov.bn/rtb.gov.bn.channels.xml --output=guide.xml --days=2

const { parser, url } = require('./rtb.gov.bn.config.js')
const path = require('path')
const fs = require('fs')
const dayjs = require('dayjs')
const utc = require('dayjs/plugin/utc')
const customParseFormat = require('dayjs/plugin/customParseFormat')
dayjs.extend(customParseFormat)
dayjs.extend(utc)

const date = dayjs.utc('2021-11-11', 'YYYY-MM-DD').startOf('d')
const channel = {
  site_id: 'Sukmaindera',
  xmltv_id: 'RTBSukmaindera.bn'
}

it('can generate valid url', () => {
  expect(url({ channel, date })).toBe(
    'http://www.rtb.gov.bn/PublishingImages/SitePages/Programme%20Guide/Sukmaindera%2011%20November%202021.pdf'
  )
})

it('can parse Sukmaindera 11 November 2021.pdf', done => {
  const buffer = fs.readFileSync(
    path.resolve(__dirname, '__data__/Sukmaindera 11 November 2021.pdf'),
    {
      charset: 'utf8'
    }
  )
  parser({ buffer, date })
    .then(results => {
      results = results.map(p => {
        p.start = p.start.toJSON()
        p.stop = p.stop.toJSON()
        return p
      })
      expect(results.length).toBe(47)
      expect(results[0]).toMatchObject({
        start: '2021-11-10T22:00:00.000Z',
        stop: '2021-11-10T22:05:00.000Z',
        title: 'NATIONAL ANTHEM'
      })
      expect(results[46]).toMatchObject({
        start: '2021-11-11T21:30:00.000Z',
        stop: '2021-11-11T22:30:00.000Z',
        title: 'BACAAN SURAH YASSIN'
      })
      done()
    })
    .catch(error => {
      done(error)
    })
})

it('can parse Aneka 11 November 2021.pdf', done => {
  const buffer = fs.readFileSync(path.resolve(__dirname, '__data__/Aneka 11 November 2021.pdf'), {
    charset: 'utf8'
  })
  parser({ buffer, date })
    .then(results => {
      results = results.map(p => {
        p.start = p.start.toJSON()
        p.stop = p.stop.toJSON()
        return p
      })
      expect(results.length).toBe(26)
      expect(results[4]).toMatchObject({
        start: '2021-11-11T03:00:00.000Z',
        stop: '2021-11-11T04:05:00.000Z',
        title: 'DRAMA TURKI:'
      })
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
    content: `<html><head><title>Object moved</title></head><body>
<h2>Object moved to <a href="/en/_layouts/OGP/ErrorPage.aspx">here</a>.</h2>
</body></html>
`
  })
    .then(result => {
      expect(result).toMatchObject([])
      done()
    })
    .catch(error => {
      done(error)
    })
})
