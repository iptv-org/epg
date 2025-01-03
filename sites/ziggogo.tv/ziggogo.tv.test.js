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

const date = dayjs.utc('2024-12-17', 'YYYY-MM-DD').startOf('d')
const channel = {
  site_id: 'NL_000001_019401',
  xmltv_id: 'NPO1.nl'
}

axios.get.mockImplementation(url => {
  const urls = {
    'https://static.spark.ziggogo.tv/eng/web/epg-service-lite/nl/en/events/segments/20241217000000':
      'content00.json',
    'https://static.spark.ziggogo.tv/eng/web/epg-service-lite/nl/en/events/segments/20241217060000':
      'content06.json',
    'https://static.spark.ziggogo.tv/eng/web/epg-service-lite/nl/en/events/segments/20241217120000':
      'content12.json',
    'https://static.spark.ziggogo.tv/eng/web/epg-service-lite/nl/en/events/segments/20241217180000':
      'content18.json',
    'https://spark-prod-nl.gnp.cloud.ziggogo.tv/eng/web/linear-service/v2/replayEvent/crid:~~2F~~2Fgn.tv~~2F28844562~~2FEP027607161610,imi:1d49feeb2ef4e3db0bde030e7cf6e55e06d56fed?returnLinearContent=true&forceLinearResponse=true&language=nl':
      'program01.json',
    'https://spark-prod-nl.gnp.cloud.ziggogo.tv/eng/web/linear-service/v2/replayEvent/crid:~~2F~~2Fgn.tv~~2F28842707~~2FEP022675661065,imi:33138a61bfa639696f386a5b8da9052e98cffdf8?returnLinearContent=true&forceLinearResponse=true&language=nl':
      'program02.json',
    'https://spark-prod-nl.gnp.cloud.ziggogo.tv/eng/web/linear-service/v2/replayEvent/crid:~~2F~~2Fgn.tv~~2F28728829~~2FEP052397600066,imi:34a0b026912de96e3546b15ad2983070a250dfd5?returnLinearContent=true&forceLinearResponse=true&language=nl':
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
    'https://static.spark.ziggogo.tv/eng/web/epg-service-lite/nl/en/events/segments/20241217000000'
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
    start: '2024-12-17T00:10:00.000Z',
    stop: '2024-12-17T00:35:00.000Z',
    title: 'EenVandaag',
    description:
      'Op pad met HTS-rebellen in Syrië. Nieuwe aanpak tegen te veel zitten. VS heeft Tiktok-ban bijna rond. Wat is de rol van Nederland in de onderhandeling rondom Oekraïne?',
    category: ['Nieuws', 'Actualiteit'],
    season: 11,
    episode: 300,
    actor: [
      'Rik van de Westelaken',
      'Roos Moggré',
      'Pieter Jan Hagens',
      'Toine van Peperstraten',
      'Charlotte Nijs',
      'Hila Noorzai',
      'Rob Hadders',
      'Joyce Boverhuis'
    ]
  })
  expect(result[2]).toMatchObject({
    start: '2024-12-17T14:55:00.000Z',
    stop: '2024-12-17T15:58:00.000Z',
    title: 'Bar Laat',
    description:
      'Bij het Rijnstate Ziekenhuis zijn opnieuw enorme misstanden aan het licht gekomen rond spermadonatie. KRO-NCRV maakte er een docuserie over. Maker Annemieke Ruggenberg schuift aan samen met zaaddonor Peter en donorkinderen Roos en Maria.',
    category: ['Talkshow'],
    season: 1,
    episode: 65,
    actor: ['Sophie Hilbrand', 'Jeroen Pauw', 'Tim de Wit']
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
