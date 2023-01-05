// npm run channels:parse --config=./sites/walesi.com.fj/walesi.com.fj.config.js --output=./sites/walesi.com.fj/walesi.com.fj.channels.xml
// npx epg-grabber --config=sites/walesi.com.fj/walesi.com.fj.config.js --channels=sites/walesi.com.fj/walesi.com.fj.channels.xml --output=guide.xml --days=2

const { parser, url, request } = require('./walesi.com.fj.config.js')
const dayjs = require('dayjs')
const utc = require('dayjs/plugin/utc')
const customParseFormat = require('dayjs/plugin/customParseFormat')
dayjs.extend(customParseFormat)
dayjs.extend(utc)

const date = dayjs.utc('2021-11-21', 'YYYY-MM-DD').startOf('d')
const channel = {
  site_id: 'fbc-2',
  xmltv_id: 'FBCTV.fj'
}

it('can generate valid url', () => {
  expect(url).toBe('https://www.walesi.com.fj/wp-admin/admin-ajax.php')
})

it('can generate valid request method', () => {
  expect(request.method).toBe('POST')
})

it('can generate valid request headers', () => {
  expect(request.headers).toMatchObject({
    'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8'
  })
})

it('can generate valid request data', () => {
  const result = request.data({ date, channel })
  expect(result.has('chanel')).toBe(true)
  expect(result.has('date')).toBe(true)
  expect(result.has('action')).toBe(true)
})

it('can parse response', () => {
  const content = `{"html":"\\t\\t\\t\\t\\t<table>\\r\\n\\t\\t\\t\\t\\t\\t<thead>\\r\\n\\t\\t\\t\\t\\t\\t\\t<tr>\\r\\n\\t\\t\\t\\t\\t\\t\\t\\t<th class=\\"extvs-table1-image\\">Image</th>\\r\\n\\t\\t\\t\\t\\t\\t\\t\\t<th class=\\"extvs-table1-time\\">Time</th>\\r\\n\\t\\t\\t\\t\\t\\t\\t\\t<th class=\\"extvs-table1-programme\\">Programme</th>\\r\\n\\t\\t\\t\\t\\t\\t\\t</tr>\\r\\n\\t\\t\\t\\t\\t\\t</thead>\\r\\n\\t\\t\\t\\t\\t\\t<tbody>\\r\\n\\r\\n\\t\\t\\t\\t\\t\\t\\t\\t\\t\\r\\n<tr class=\\"\\">\\r\\n\\t<td class=\\"extvs-table1-image\\">\\r\\n\\t\\t\\t</td>\\r\\n\\t<td class=\\"extvs-table1-time\\"><span>12:00 am</span></td>\\r\\n\\t<td class=\\"extvs-table1-programme\\">\\r\\n\\t\\t<div class=\\"item-tvs\\">\\r\\n\\t\\t\\t<div class=\\"extvs-arrow\\">\\r\\n\\t\\t\\t\\t<figure class=\\"extvs-simple-sch\\">\\r\\n\\t\\t\\t\\t\\t<div class=\\"extvs-st2-plus\\"><div class=\\"extvs-icon-plus\\"></div></div>\\r\\n\\t\\t\\t\\t\\t<h3>Aljazeera</h3>\\r\\n\\t\\t\\t\\t\\t\\t\\t\\t\\t\\t\\t\\t\\t\\t</figure>\\r\\n\\t\\t\\t</div>\\r\\n\\t\\t\\t\\t\\t</div>\\r\\n\\t</td>\\r\\n</tr>\\t\\t\\t\\t\\t\\t\\t\\t\\t\\r\\n<tr class=\\"\\"> <td class=\\"extvs-table1-image\\"> </td><td class=\\"extvs-table1-time\\"><span>6:00 am</span></td><td class=\\"extvs-table1-programme\\"> <div class=\\"item-tvs\\"> <div class=\\"extvs-arrow\\"> <figure class=\\"extvs-simple-sch\\"> <div class=\\"extvs-st2-plus\\"><div class=\\"extvs-icon-plus\\"></div></div><h3>Move Fiji</h3> </figure> </div></div></td></tr></tbody></table>\\r\\n\\t\\t\\t\\t"}`
  const result = parser({ content, date }).map(p => {
    p.start = p.start.toJSON()
    p.stop = p.stop.toJSON()
    return p
  })

  expect(result).toMatchObject([
    {
      start: '2021-11-20T12:00:00.000Z',
      stop: '2021-11-20T18:00:00.000Z',
      title: `Aljazeera`
    },
    {
      start: '2021-11-20T18:00:00.000Z',
      stop: '2021-11-20T18:30:00.000Z',
      title: `Move Fiji`
    }
  ])
})

it('can handle empty guide', () => {
  const result = parser({
    date,
    channel,
    content: `{"html":"<p class=\\"ex-notice\\">No matching records found</p>"}`
  })
  expect(result).toMatchObject([])
})
