// npx epg-grabber --config=sites/guidatv.sky.it/guidatv.sky.it.config.js --channels=sites/guidatv.sky.it/guidatv.sky.it.channels.xml --output=guide.xml --days=2

const { parser, url } = require('./guidatv.sky.it.config.js')
const dayjs = require('dayjs')
const utc = require('dayjs/plugin/utc')
const customParseFormat = require('dayjs/plugin/customParseFormat')
dayjs.extend(customParseFormat)
dayjs.extend(utc)

const date = dayjs.utc('2022-05-06', 'YYYY-MM-DD').startOf('d')
const channel = {
  site_id: 'DTH#10458',
  xmltv_id: '20Mediaset.it'
}

it('can generate valid url', () => {
  expect(url({ channel, date })).toBe(
    'https://apid.sky.it/gtv/v1/events?from=2022-05-06T00:00:00Z&to=2022-05-07T00:00:00Z&pageSize=999&pageNum=0&env=DTH&channels=10458'
  )
})

it('can parse response', () => {
  const content = `{"events": [ { "channel": { "id": 10458, "logo": "/logo/545820mediasethd_Light_Fit.png", "logoPadding": "/logo/545820mediasethd_Light_Padding.png", "logoDark": "/logo/545820mediasethd_Dark_Fit.png", "logoDarkPadding": "/logo/545820mediasethd_Dark_Padding.png", "logoLight": "/logo/545820mediasethd_Light_Padding.png", "name": "20Mediaset HD", "number": 151, "category": { "id": 3, "name": "Intrattenimento" } }, "content": { "uuid": "77c630aa-4744-44cb-a88e-3e871c6b73d9", "contentTitle": "Distretto di Polizia", "episodeNumber": 26, "seasonNumber": 6, "url": "/serie-tv/distretto-di-polizia/stagione-6/episodio-26/77c630aa-4744-44cb-a88e-3e871c6b73d9", "genre": { "id": 1, "name": "Intrattenimento" }, "subgenre": { "id": 9, "name": "Fiction" }, "imagesMap": [ { "key": "background", "img": { "url": "/uuid/77c630aa-4744-44cb-a88e-3e871c6b73d9/background?md5ChecksumParam=88d3f48ce855316f4be25ab9bb846d32" } }, { "key": "cover", "img": { "url": "/uuid/77c630aa-4744-44cb-a88e-3e871c6b73d9/cover?md5ChecksumParam=61135b999a63e3d3f4a933b9edeb0c1b" } }, { "key": "scene", "img": { "url": "/uuid/77c630aa-4744-44cb-a88e-3e871c6b73d9/16-9?md5ChecksumParam=f41bfe414bec32505abdab19d00b8b43" } } ] }, "eventId": "139585132", "starttime": "2022-05-06T00:35:40Z", "endtime": "2022-05-06T01:15:40Z", "eventTitle": "Distretto di Polizia", "eventSynopsis": "S6 Ep26 La resa dei conti - Fino all'ultimo la sfida tra Ardenzi e Carrano, nemici di vecchia data, riserva clamorosi colpi di scena. E si scopre che non e' tutto come sembrava.", "epgEventTitle": "S6 Ep26 - Distretto di Polizia", "primeVision": false, "resolutions": [ { "resolutionType": "resolution4k", "value": false } ] }]}`
  const result = parser({ content }).map(p => {
    p.start = p.start.toJSON()
    p.stop = p.stop.toJSON()
    return p
  })

  expect(result).toMatchObject([
    {
      start: '2022-05-06T00:35:40.000Z',
      stop: '2022-05-06T01:15:40.000Z',
      title: 'Distretto di Polizia',
      description:
        "S6 Ep26 La resa dei conti - Fino all'ultimo la sfida tra Ardenzi e Carrano, nemici di vecchia data, riserva clamorosi colpi di scena. E si scopre che non e' tutto come sembrava.",
      season: 6,
      episode: 26,
      icon: 'https://guidatv.sky.it/uuid/77c630aa-4744-44cb-a88e-3e871c6b73d9/cover?md5ChecksumParam=61135b999a63e3d3f4a933b9edeb0c1b',
      category: 'Intrattenimento/Fiction',
      url: 'https://guidatv.sky.it/serie-tv/distretto-di-polizia/stagione-6/episodio-26/77c630aa-4744-44cb-a88e-3e871c6b73d9'
    }
  ])
})

it('can handle empty guide', () => {
  const result = parser({
    content: `{"events":[],"total":0}`
  })
  expect(result).toMatchObject([])
})
