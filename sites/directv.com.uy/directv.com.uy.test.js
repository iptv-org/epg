// npx epg-grabber --config=sites/directv.com.uy/directv.com.uy.config.js --channels=sites/directv.com.uy/directv.com.uy.channels.xml --output=guide.xml --days=2

const { parser, url, request } = require('./directv.com.uy.config.js')
const fs = require('fs')
const path = require('path')
const dayjs = require('dayjs')
const utc = require('dayjs/plugin/utc')
const customParseFormat = require('dayjs/plugin/customParseFormat')
dayjs.extend(customParseFormat)
dayjs.extend(utc)

const date = dayjs.utc('2022-08-29', 'YYYY-MM-DD').startOf('d')
const channel = {
  site_id: '184#VTV',
  xmltv_id: 'VTV.uy'
}

it('can generate valid url', () => {
  expect(url).toBe('https://www.directv.com.uy/guia/ChannelDetail.aspx/GetProgramming')
})

it('can generate valid request method', () => {
  expect(request.method).toBe('POST')
})

it('can generate valid request headers', () => {
  expect(request.headers).toMatchObject({
    'Content-Type': 'application/json; charset=UTF-8',
    Cookie: 'PGCSS=16384; PGLang=S; PGCulture=es-UY;'
  })
})

it('can generate valid request data', () => {
  expect(request.data({ channel, date })).toMatchObject({
    filterParameters: {
      day: 29,
      time: 0,
      minute: 0,
      month: 8,
      year: 2022,
      offSetValue: 0,
      filtersScreenFilters: [''],
      isHd: '',
      isChannelDetails: 'Y',
      channelNum: '184',
      channelName: 'VTV'
    }
  })
})

it('can parse response', () => {
  const content = fs.readFileSync(path.resolve(__dirname, '__data__/content.json'))
  const results = parser({ content, channel }).map(p => {
    p.start = p.start.toJSON()
    p.stop = p.stop.toJSON()
    return p
  })

  expect(results[0]).toMatchObject({
    start: '2022-08-29T03:00:00.000Z',
    stop: '2022-08-29T05:00:00.000Z',
    title: 'Peñarol vs. Danubio : Fútbol Uruguayo Primera División - Peñarol vs. Danubio',
    description:
      'Jornada 5 del Torneo Clausura 2022. Peñarol recibe a Danubio en el estadio Campeón del Siglo. Los carboneros llevan 3 partidos sin caer (2PG 1PE), mientras que los franjeados acumulan 6 juegos sin derrotas (4PG 2PE).',
    rating: {
      system: 'MPA',
      value: 'NR'
    }
  })
})

it('can handle empty guide', () => {
  const result = parser({
    content: ``,
    channel
  })
  expect(result).toMatchObject([])
})
