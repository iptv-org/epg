// node ./scripts/channels.js --config=./sites/maxtvgo.mk/maxtvgo.mk.config.js --output=./sites/maxtvgo.mk/maxtvgo.mk.channels.xml
// npx epg-grabber --config=sites/maxtvgo.mk/maxtvgo.mk.config.js --channels=sites/maxtvgo.mk/maxtvgo.mk.channels.xml --output=guide.xml --days=2

const { parser, url } = require('./maxtvgo.mk.config.js')
const dayjs = require('dayjs')
const utc = require('dayjs/plugin/utc')
const customParseFormat = require('dayjs/plugin/customParseFormat')
dayjs.extend(customParseFormat)
dayjs.extend(utc)

const date = dayjs.utc('2021-11-17', 'YYYY-MM-DD').startOf('d')
const channel = {
  site_id: '105',
  xmltv_id: 'MRT1.mk'
}

it('can generate valid url', () => {
  expect(url({ channel, date })).toBe(
    'https://prd-static-mkt.spectar.tv/rev-1636968171/client_api.php/epg/list/instance_id/1/language/mk/channel_id/105/start/20211117000000/stop/20211118000000/include_current/true/format/json'
  )
})

it('can parse response', () => {
  const content = `{"programme":[{"@attributes":{"channel":"105","id":"21949063","start":"20211116231000 +0100","stop":"20211117010000 +0100","disable_catchup":"0","is_adult":"0"},"title":"Палмето - игран филм","original-title":{"@attributes":{"lang":""}},"sub-title":{"@attributes":{"lang":""}},"category_id":"11","category":"Останато","desc":"Екстремниот рибар, Џереми Вејд, е во потрага по слатководни риби кои јадат човечко месо. Со форензички методи, Џереми им илустрира на гледачите како овие нови чудовишта се создадени да убиваат.","icon":{"@attributes":{"src":"https:\/\/prd-static-mkt.spectar.tv\/rev-1636968170\/image_transform.php\/transform\/1\/epg_program_id\/21949063\/instance_id\/1"}},"episode_num":{},"date":"0","star-rating":{"value":{}},"rating":{"@attributes":{"system":""},"value":"0+"},"linear_channel_rating":"0+","genres":{},"credits":{}}]}`
  const result = parser({ content }).map(p => {
    p.start = p.start.toJSON()
    p.stop = p.stop.toJSON()
    return p
  })

  expect(result).toMatchObject([
    {
      start: '2021-11-16T22:10:00.000Z',
      stop: '2021-11-17T00:00:00.000Z',
      title: 'Палмето - игран филм',
      category: 'Останато',
      description:
        'Екстремниот рибар, Џереми Вејд, е во потрага по слатководни риби кои јадат човечко месо. Со форензички методи, Џереми им илустрира на гледачите како овие нови чудовишта се создадени да убиваат.',
      icon: 'https://prd-static-mkt.spectar.tv/rev-1636968170/image_transform.php/transform/1/epg_program_id/21949063/instance_id/1'
    }
  ])
})

it('can parse response with no description', () => {
  const content = `{"programme":[{"@attributes":{"channel":"105","id":"21949063","start":"20211116231000 +0100","stop":"20211117010000 +0100","disable_catchup":"0","is_adult":"0"},"title":"Палмето - игран филм","original-title":{"@attributes":{"lang":""}},"sub-title":{"@attributes":{"lang":""}},"category_id":"11","category":"Останато","desc":{},"icon":{"@attributes":{"src":"https:\/\/prd-static-mkt.spectar.tv\/rev-1636968170\/image_transform.php\/transform\/1\/epg_program_id\/21949063\/instance_id\/1"}},"episode_num":{},"date":"0","star-rating":{"value":{}},"rating":{"@attributes":{"system":""},"value":"0+"},"linear_channel_rating":"0+","genres":{},"credits":{}}]}`
  const result = parser({ content }).map(p => {
    p.start = p.start.toJSON()
    p.stop = p.stop.toJSON()
    return p
  })

  expect(result).toMatchObject([
    {
      start: '2021-11-16T22:10:00.000Z',
      stop: '2021-11-17T00:00:00.000Z',
      title: 'Палмето - игран филм',
      category: 'Останато',
      description: null,
      icon: 'https://prd-static-mkt.spectar.tv/rev-1636968170/image_transform.php/transform/1/epg_program_id/21949063/instance_id/1'
    }
  ])
})

it('can handle empty guide', () => {
  const result = parser({
    date,
    channel,
    content: `{"@attributes":{"source-info-name":"maxtvgo.mk","generator-info-name":"spectar_epg"}}`
  })
  expect(result).toMatchObject([])
})
