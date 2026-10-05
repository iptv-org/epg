const { parser, url, request } = require('./directv.com.ar.config.js')
const fs = require('fs')
const path = require('path')
const dayjs = require('dayjs')
const utc = require('dayjs/plugin/utc')
const customParseFormat = require('dayjs/plugin/customParseFormat')
dayjs.extend(customParseFormat)
dayjs.extend(utc)

const date = dayjs.utc('2022-06-19', 'YYYY-MM-DD').startOf('d')
const channel = {
  site_id: '207#A&amp;EHD',
  xmltv_id: 'AEHDSouth.us'
}

it('can generate valid url', () => {
  expect(url).toBe('https://www.directv.com.ar/guia/ChannelDetail.aspx/GetProgramming')
})

it('can generate valid request method', () => {
  expect(request.method).toBe('POST')
})

it('can generate valid request headers', () => {
  expect(request.headers).toMatchObject({
    'Content-Type': 'application/json; charset=UTF-8',
    Cookie: 'PGCSS=16; PGLang=S; PGCulture=es-AR;'
  })
})

it('can generate valid request data', () => {
  expect(request.data({ channel, date })).toMatchObject({
    filterParameters: {
      day: 19,
      time: 0,
      minute: 0,
      month: 6,
      year: 2022,
      offSetValue: 0,
      filtersScreenFilters: [''],
      isHd: '',
      isChannelDetails: 'Y',
      channelNum: '207',
      channelName: 'A&EHD'
    }
  })
})

it('can parse response', () => {
  const content = fs.readFileSync(path.resolve(__dirname, '__data__/content.json'))
  const result = parser({ content, channel }).map(p => {
    p.start = p.start.toJSON()
    p.stop = p.stop.toJSON()
    return p
  })

  expect(result).toMatchObject([
    {
      start: '2022-06-19T03:00:00.000Z',
      stop: '2022-06-19T03:15:00.000Z',
      title: 'Chicas guapas',
      description:
        'Un espacio destinado a la belleza y los distintos estilos de vida, que muestra el trabajo inspiracional de la moda latinoamericana.',
      rating: {
        system: 'MPA',
        value: 'NR'
      }
    }
  ])
})

it('can handle empty guide', () => {
  const result = parser({
    content: '',
    channel
  })
  expect(result).toMatchObject([])
})
