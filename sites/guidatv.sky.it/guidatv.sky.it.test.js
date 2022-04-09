// npx epg-grabber --config=sites/guidatv.sky.it/guidatv.sky.it.config.js --channels=sites/guidatv.sky.it/guidatv.sky.it_it.channels.xml --output=guide.xml --days=2

const { parser, url } = require('./guidatv.sky.it.config.js')
const dayjs = require('dayjs')
const utc = require('dayjs/plugin/utc')
const customParseFormat = require('dayjs/plugin/customParseFormat')
dayjs.extend(customParseFormat)
dayjs.extend(utc)

const date = dayjs.utc('2022-04-01', 'YYYY-MM-DD').startOf('d')
const channel = {
  site_id: 'DTH#10458',
  xmltv_id: '20Mediaset.it'
}

it('can generate valid url', () => {
  expect(url({ channel, date })).toBe(
    'https://apid.sky.it/gtv/v1/events?from=2022-04-01T00:00:00Z&to=2022-04-02T00:00:00Z&pageSize=999&pageNum=0&env=DTH&channels=10458'
  )
})

it('can parse response', () => {
  const content = `{"events":[{"channel":{"id":10458,"logo":"/logo/545820mediasethd_Light_Fit.png","logoPadding":"/logo/545820mediasethd_Light_Padding.png","logoDark":"/logo/545820mediasethd_Dark_Fit.png","logoDarkPadding":"/logo/545820mediasethd_Dark_Padding.png","logoLight":"/logo/545820mediasethd_Light_Padding.png","name":"20Mediaset HD","number":151,"category":{"id":3,"name":"Intrattenimento"}},"content":{"uuid":"1c35aa09-24e6-42e0-a2a0-2e58976ca793","contentTitle":"Shades of Blue","episodeNumber":2,"seasonNumber":3,"url":"/serie-tv/shades-of-blue/stagione-3/episodio-2/1c35aa09-24e6-42e0-a2a0-2e58976ca793","genre":{"id":1,"name":"Intrattenimento"},"subgenre":{"id":9,"name":"Fiction"},"imagesMap":[{"key":"background","img":{"url":"/uuid/1c35aa09-24e6-42e0-a2a0-2e58976ca793/background?md5ChecksumParam=311e053b4e6aacdd6cc25694c4d41a9a"}},{"key":"cover","img":{"url":"/uuid/1c35aa09-24e6-42e0-a2a0-2e58976ca793/cover?md5ChecksumParam=33cc326236e0894c5ba2a7a4795c3b5b"}},{"key":"scene","img":{"url":"/uuid/1c35aa09-24e6-42e0-a2a0-2e58976ca793/16-9?md5ChecksumParam=5756d4854b2f867b1764ee07fc2a18b8"}}]},"eventId":"138957327","starttime":"2022-04-01T00:24:28Z","endtime":"2022-04-01T01:04:28Z","eventTitle":"Shades of blue","eventSynopsis":"S3 Ep2 La vacuita' del potere - con J. Lopez - Harlee deve affrontare la perdita di Nava e non si da' per vinta nel credere che dietro al suo omicidio ci sia Ramsey.","epgEventTitle":"S3 Ep2 - Shades of blue","primeVision":false,"resolutions":[{"resolutionType":"resolution4k","value":false}]}]}`
  const result = parser({ content }).map(p => {
    p.start = p.start.toJSON()
    p.stop = p.stop.toJSON()
    return p
  })

  expect(result).toMatchObject([
    {
      start: '2022-04-01T00:24:28.000Z',
      stop: '2022-04-01T01:04:28.000Z',
      title: 'Shades of blue',
      description:
        "S3 Ep2 La vacuita' del potere - con J. Lopez - Harlee deve affrontare la perdita di Nava e non si da' per vinta nel credere che dietro al suo omicidio ci sia Ramsey.",
      season: 3,
      episode: 2,
      icon: 'https://guidatv.sky.it/uuid/1c35aa09-24e6-42e0-a2a0-2e58976ca793/cover?md5ChecksumParam=33cc326236e0894c5ba2a7a4795c3b5b',
      category: 'Intrattenimento/Fiction'
    }
  ])
})

it('can handle empty guide', () => {
  const result = parser({
    content: `{"events":[],"total":0}`
  })
  expect(result).toMatchObject([])
})
