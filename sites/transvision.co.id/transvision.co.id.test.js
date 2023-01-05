// npx epg-grabber --config=sites/transvision.co.id/transvision.co.id.config.js --channels=sites/transvision.co.id/transvision.co.id.channels.xml --output=guide.xml --days=2

const { parser, url, request } = require('./transvision.co.id.config.js')
const dayjs = require('dayjs')
const utc = require('dayjs/plugin/utc')
dayjs.extend(utc)

const date = dayjs.utc('2022-03-10', 'YYYY-MM-DD').startOf('d')
const channel = {
  site_id: 'TRIS',
  xmltv_id: 'nsert.id'
}
const content = `<!doctype html><html class="no-js" lang="zxx"> <head></head> <body> <div class="wrapper"> <div id="content"> <div class="epg-area bg-white ptb-80"> <div class="container"> <div class="row"> <div class="col-sm-12"> <div class="component"> <div style="overflow: auto;"> <table> <tbody> <tr> <th>00:00:00</th> <td>Insert Today</td><td>Insert adalah program infotainment yang menceritakan berita-berita kehidupan selebriti serta gosip-gosipnya dan disajikan secara aktual dan faktual dengan suasana yang santai.</td></tr><tr> <th>01:00:00</th> <td>Brownis</td><td>Brownis atau obrolan manis merupakan program talkshow segar yang dipandu oleh Ruben Onsu bersama Ivan Gunawan.</td></tr><tr> <th>01:30:00</th> <td>Warga +62</td><td>Warga +62 menghadirkan trend penyebaran video/momen lucu yang juga dikenal sebagai video lucu Indonesia yang tersebar di media sosial.</td></tr><tr> <th>23:00:00</th> <td>Insert</td><td>Insert adalah program infotainment yang menceritakan berita-berita kehidupan selebriti serta gosip-gosipnya dan disajikan secara aktual dan faktual dengan suasana yang santai.</td></tr></tbody> </table> </div></div></div></div></div></div></div></div></body></html>`

it('can generate valid url', () => {
  expect(url).toBe('https://www.transvision.co.id/jadwalacara/epg')
})

it('can generate valid request method', () => {
  expect(request.method).toBe('POST')
})

it('can generate valid request headers', () => {
  expect(request.headers).toMatchObject({
    'Content-Type': 'application/x-www-form-urlencoded'
  })
})

it('can generate valid request data', () => {
  const result = request.data({ channel, date })
  expect(result.get('ValidateEPG[channel_name]')).toBe('TRIS')
  expect(result.get('ValidateEPG[tanggal]')).toBe('2022-03-10')
  expect(result.get('ValidateEPG[sinopsis]')).toBe('')
  expect(result.get('yt0')).toBe('PROSES')
})

it('can parse response', () => {
  const result = parser({ content, channel, date }).map(p => {
    p.start = p.start.toJSON()
    p.stop = p.stop.toJSON()
    return p
  })

  expect(result).toMatchObject([
    {
      title: 'Insert Today',
      description:
        'Insert adalah program infotainment yang menceritakan berita-berita kehidupan selebriti serta gosip-gosipnya dan disajikan secara aktual dan faktual dengan suasana yang santai.',
      start: '2022-03-09T17:00:00.000Z',
      stop: '2022-03-09T18:00:00.000Z'
    },
    {
      title: 'Brownis',
      description:
        'Brownis atau obrolan manis merupakan program talkshow segar yang dipandu oleh Ruben Onsu bersama Ivan Gunawan.',
      start: '2022-03-09T18:00:00.000Z',
      stop: '2022-03-09T18:30:00.000Z'
    },
    {
      title: 'Warga +62',
      description:
        'Warga +62 menghadirkan trend penyebaran video/momen lucu yang juga dikenal sebagai video lucu Indonesia yang tersebar di media sosial.',
      start: '2022-03-09T18:30:00.000Z',
      stop: '2022-03-10T16:00:00.000Z'
    },
    {
      title: 'Insert',
      description:
        'Insert adalah program infotainment yang menceritakan berita-berita kehidupan selebriti serta gosip-gosipnya dan disajikan secara aktual dan faktual dengan suasana yang santai.',
      start: '2022-03-10T16:00:00.000Z',
      stop: '2022-03-10T16:30:00.000Z'
    }
  ])
})

it('can handle empty guide', () => {
  const result = parser({
    content: `<!doctype html><html class="no-js" lang="zxx"><head></head><body></body></html>`
  })
  expect(result).toMatchObject([])
})
