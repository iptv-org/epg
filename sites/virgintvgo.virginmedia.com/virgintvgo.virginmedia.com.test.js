const { parser, url } = require('./virgintvgo.virginmedia.com.config.js')
const fs = require('fs')
const path = require('path')
const axios = require('axios')
const dayjs = require('dayjs')
const utc = require('dayjs/plugin/utc')
const customParseFormat = require('dayjs/plugin/customParseFormat')

dayjs.extend(customParseFormat)
dayjs.extend(utc)

jest.mock('axios')

const date = dayjs.utc('2024-12-14', 'YYYY-MM-DD').startOf('d')
const channel = {
  site_id: '1958',
  xmltv_id: '5ActionHD.uk'
}

axios.get.mockImplementation(url => {
  const urls = {
    'https://staticqbr-prod-gb.gnp.cloud.virgintvgo.virginmedia.com/eng/web/epg-service-lite/gb/en/events/segments/20241214000000':
      'content00.json',
    'https://staticqbr-prod-gb.gnp.cloud.virgintvgo.virginmedia.com/eng/web/epg-service-lite/gb/en/events/segments/20241214060000':
      'content06.json',
    'https://staticqbr-prod-gb.gnp.cloud.virgintvgo.virginmedia.com/eng/web/epg-service-lite/gb/en/events/segments/20241214120000':
      'content12.json',
    'https://staticqbr-prod-gb.gnp.cloud.virgintvgo.virginmedia.com/eng/web/epg-service-lite/gb/en/events/segments/20241214180000':
      'content18.json',
    'https://spark-prod-gb.gnp.cloud.virgintvgo.virginmedia.com/eng/web/linear-service/v2/replayEvent/crid:~~2F~~2Fgn.tv~~2F16647964~~2FEP012911720228,imi:74a552c465e11e5fe6ed7bfae7aeda5b639322ff?returnLinearContent=true&forceLinearResponse=true&language=en':
      'program01.json',
    'https://spark-prod-gb.gnp.cloud.virgintvgo.virginmedia.com/eng/web/linear-service/v2/replayEvent/crid:~~2F~~2Fgn.tv~~2F17641069~~2FEP026460800059,imi:23c363d12af79f43134f4a15b96dd12df81b19ab?returnLinearContent=true&forceLinearResponse=true&language=en':
      'program02.json',
    'https://spark-prod-gb.gnp.cloud.virgintvgo.virginmedia.com/eng/web/linear-service/v2/replayEvent/crid:~~2F~~2Fgn.tv~~2F19221598~~2FSH037146530000~~2F333458689,imi:f1060b3f63cd5399e0f97901b25a85ef71097891?returnLinearContent=true&forceLinearResponse=true&language=en':
      'program03.json'
  }
  let data = ''
  if (urls[url] !== undefined) {
    data = fs.readFileSync(path.join(__dirname, '__data__', urls[url])).toString()
    if (!urls[url].startsWith('content00')) {
      data = JSON.parse(data)
    }
  }
  return Promise.resolve({ data })
})

it('can generate valid url', () => {
  expect(url({ date })).toBe(
    'https://staticqbr-prod-gb.gnp.cloud.virgintvgo.virginmedia.com/eng/web/epg-service-lite/gb/en/events/segments/20241214000000'
  )
})

it('can parse response', async () => {
  const content = await axios
    .get(url({ date }))
    .then(response => response.data)
    .catch(console.error)
  const result = (await parser({ content, channel, date })).map(p => {
    p.start = p.start.toJSON()
    p.stop = p.stop.toJSON()
    return p
  })

  expect(result.length).toBe(3)
  expect(result[0]).toMatchObject({
    start: '2024-12-14T00:00:00.000Z',
    stop: '2024-12-14T01:05:00.000Z',
    title: 'Police Interceptors',
    description:
      'Eight police cars and the eye in the sky hunt down a high powered Porsche Cayenne that is causing carnage. Undertaking at high speeds and goading the interceptors, the driver even manages to take out several police cars.',
    category: ['Reality', 'Crime'],
    season: 16,
    episode: 1
  })
  expect(result[2]).toMatchObject({
    start: '2024-12-14T22:00:00.000Z',
    stop: '2024-12-14T22:05:00.000Z',
    title: 'Entertainment News On 5',
    description:
      'A daily round-up of showbiz news and gossip from around the world, focusing on celebrities, movies, music and entertainment.',
    category: ['News', 'Entertainment'],
    season: 46530000,
    episode: 333458689,
    actor: ['Jamie Burton']
  })
})

it('can handle empty guide', async () => {
  const result = await parser({
    content: '',
    channel,
    date
  })
  expect(result).toMatchObject([])
})
