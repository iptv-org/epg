const { parser, url } = require('./ziggogo.tv.config.js')
const fs = require('fs')
const path = require('path')
const axios = require('axios')
const dayjs = require('dayjs')
const utc = require('dayjs/plugin/utc')
const customParseFormat = require('dayjs/plugin/customParseFormat')

dayjs.extend(customParseFormat)
dayjs.extend(utc)

jest.mock('axios')

const date = dayjs.utc('2026-05-30').startOf('d')
const channel = {
  site_id: 'NL_000007_019181',
  xmltv_id: 'RTL7.nl@SD'
}

axios.get.mockImplementation(url => {
  const urls = {
    'https://staticqbr-prod-nl.gnp.cloud.ziggogo.tv/eng/web/epg-service-lite/nl/en/events/segments/20260530000000':
      'content00.json',
    'https://staticqbr-prod-nl.gnp.cloud.ziggogo.tv/eng/web/epg-service-lite/nl/en/events/segments/20260530060000':
      'content06.json',
    'https://staticqbr-prod-nl.gnp.cloud.ziggogo.tv/eng/web/epg-service-lite/nl/en/events/segments/20260530120000':
      'content12.json',
    'https://staticqbr-prod-nl.gnp.cloud.ziggogo.tv/eng/web/epg-service-lite/nl/en/events/segments/20260530180000':
      'content18.json',
    'https://spark-prod-nl.gnp.cloud.ziggogo.tv/eng/web/linear-service/v2/replayEvent/crid:~~2F~~2Fgn.tv~~2F32036579~~2FSH062278610000~~2F492767862,imi:25ee264da729e66ee9ab4cb70d30ab2d76b661f4?returnLinearContent=true&forceLinearResponse=true&language=nl':
      'program01.json',
    'https://spark-prod-nl.gnp.cloud.ziggogo.tv/eng/web/linear-service/v2/replayEvent/crid:~~2F~~2Fgn.tv~~2F18311595~~2FEP027840300446,imi:dc898b6240c51d7bb7aa0c13d38409e025ce0a71?returnLinearContent=true&forceLinearResponse=true&language=nl':
      'program02.json'
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
    'https://staticqbr-prod-nl.gnp.cloud.ziggogo.tv/eng/web/epg-service-lite/nl/en/events/segments/20260530000000'
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

  expect(result.length).toBe(21)
  expect(result[2]).toMatchObject({
    start: '2026-05-30T04:00:00.000Z',
    stop: '2026-05-30T11:03:00.000Z',
    title: 'Telvero',
    description:
      'Homeshoppingprogramma waarin de kijker via de telefoon allerlei producten kan aanschaffen.',
    category: ["Consumentenprogramma's", 'Shoppen'],
    season: 78610000,
    episode: 492767862
  })
  expect(result[19]).toMatchObject({
    start: '2026-05-30T22:44:00.000Z',
    stop: '2026-05-30T23:39:00.000Z',
    title: 'Pawn Stars',
    subTitle: 'Mystery Safe',
    description:
      'Rick en Chum onderhandelen over een Superman-pyjama. Rick tikt een vintage industriële snijmachine op de kop. Chum roept de hulp in van Alex als hij een zeldzaam jasje uit de Tweede Wereldoorlog tegenkomt.',
    category: ['Reality', 'Veiling'],
    season: 17,
    episode: 24,
    actor: ['Corey Harrison', 'Rick Harrison', 'Austin Chumlee Russell']
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
