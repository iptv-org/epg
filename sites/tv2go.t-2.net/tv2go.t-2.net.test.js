// node ./scripts/channels.js --config=./sites/tv2go.t-2.net/tv2go.t-2.net.config.js --output=./sites/tv2go.t-2.net/tv2go.t-2.net.channels.xml
// npx epg-grabber --config=sites/tv2go.t-2.net/tv2go.t-2.net.config.js --channels=sites/tv2go.t-2.net/tv2go.t-2.net.channels.xml --output=guide.xml --days=2

const { parser, url, request } = require('./tv2go.t-2.net.config.js')
const dayjs = require('dayjs')
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
  const content = `{"entries":[{"channelId":1000259,"startTimestamp":"1637283000000","endTimestamp":"1637284500000","name":"Dnevnik Slovencev v Italiji","nameSingleLine":"Dnevnik Slovencev v Italiji","description":"Informativni","images":[{"url":"/static/media/img/epg/max_crop/EPG_IMG_2927405.jpg","width":1008,"height":720,"averageColor":[143,147,161]}],"show":{"id":51991133,"title":"Dnevnik Slovencev v Italiji","originalTitle":"Dnevnik Slovencev v Italiji","shortDescription":"Dnevnik Slovencev v Italiji je informativna oddaja, v kateri novinarji poročajo predvsem o dnevnih dogodkih med Slovenci v Italiji.","longDescription":"Pomembno ogledalo vsakdana, v katerem opozarjajo na težave, s katerimi se soočajo, predstavljajo pa tudi pestro kulturno, športno in družbeno življenje slovenske narodne skupnosti. V oddajo so vključene tudi novice iz matične domovine.","type":{"id":10,"name":"Show"},"productionFrom":"1609502400000","countries":[{"id":"SI","name":"Slovenija"}],"languages":[{"languageId":2,"name":"Slovenščina"}],"genres":[{"id":1000002,"name":"Informativni"}]}}]}`
  const result = parser({ content, channel }).map(p => {
    p.start = p.start.toJSON()
    p.stop = p.stop.toJSON()
    return p
  })

  expect(result).toMatchObject([
    {
      start: '2021-11-19T00:50:00.000Z',
      stop: '2021-11-19T01:15:00.000Z',
      title: `Dnevnik Slovencev v Italiji`,
      category: ['Informativni'],
      description: `Dnevnik Slovencev v Italiji je informativna oddaja, v kateri novinarji poročajo predvsem o dnevnih dogodkih med Slovenci v Italiji.`,
      icon: 'https://tv2go.t-2.net/static/media/img/epg/max_crop/EPG_IMG_2927405.jpg'
    }
  ])
})

it('can handle empty guide', () => {
  const result = parser({
    date,
    channel,
    content: `Invalid API client identifier`
  })
  expect(result).toMatchObject([])
})
