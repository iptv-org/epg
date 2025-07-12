const { parser, url, request } = require('./tv2go.t-2.net.config.js')
const dayjs = require('dayjs')
const fs = require('fs')
const path = require('path')
const utc = require('dayjs/plugin/utc')
const customParseFormat = require('dayjs/plugin/customParseFormat')
dayjs.extend(customParseFormat)
dayjs.extend(utc)

const date = dayjs.utc('2021-11-19', 'YYYY-MM-DD').startOf('d')
const channel = {
  site_id: '1000259',
  xmltv_id: 'TVSlovenija1.si'
}

it('can generate valid url', () => {
  expect(url({ date, channel })).toBe(
    'https://tv2go.t-2.net/Catherine/api/9.4/json/464830403846070/d79cf4dc84f2131689f426956b8d40de/client/tv/getEpg'
  )
})

it('can generate valid request headers', () => {
  expect(request.headers).toMatchObject({
    'Content-Type': 'application/json'
  })
})

it('can generate valid request data', () => {
  expect(request.data({ date, channel })).toMatchObject({
    locale: 'sl-SI',
    channelId: [1000259],
    startTime: 1637280000000,
    endTime: 1637366400000,
    imageInfo: [{ height: 500, width: 1100 }],
    includeBookmarks: false,
    includeShow: true
  })
})

it('can parse response', () => {
  const content = fs.readFileSync(path.join(__dirname, '__data__', 'content.json'), 'utf8')
  const result = parser({ content, channel }).map(p => {
    p.start = p.start.toJSON()
    p.stop = p.stop.toJSON()
    return p
  })

  expect(result).toMatchObject([
    {
      start: '2021-11-19T00:50:00.000Z',
      stop: '2021-11-19T01:15:00.000Z',
      title: 'Dnevnik Slovencev v Italiji',
      category: ['Informativni'],
      description:
        'Dnevnik Slovencev v Italiji je informativna oddaja, v kateri novinarji poročajo predvsem o dnevnih dogodkih med Slovenci v Italiji.',
      image: 'https://tv2go.t-2.net/static/media/img/epg/max_crop/EPG_IMG_2927405.jpg'
    }
  ])
})

it('can handle empty guide', () => {
  const result = parser({
    date,
    channel,
    content: 'Invalid API client identifier'
  })
  expect(result).toMatchObject([])
})
