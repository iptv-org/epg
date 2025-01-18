const { parser, url } = require('./vivoplay.com.br.config.js')
const fs = require('fs')
const path = require('path')
const dayjs = require('dayjs')
const utc = require('dayjs/plugin/utc')
const customParseFormat = require('dayjs/plugin/customParseFormat')
dayjs.extend(customParseFormat)
dayjs.extend(utc)

const date = dayjs.utc('2025-01-19', 'YYYY-MM-DD').startOf('d')
const channel = {
  site_id: 'lch5554',
  xmltv_id: 'TVNovoTempo.br'
}

it('can generate valid url', () => {
  expect(url({ channel, date })).toBe(
    'https://contentapi-br.cdn.telefonica.com/25/default/pt-BR/schedules?ca_deviceTypes=null%7C401&ca_channelmaps=779%7Cnull&fields=Pid,Title,Description,ChannelName,ChannelNumber,CallLetter,Start,End,LiveChannelPid,LiveProgramPid,EpgSerieId,SeriesPid,SeriesId,SeasonPid,SeasonNumber,EpisodeNumber,images.videoFrame,images.banner,LiveToVod,AgeRatingPid,forbiddenTechnology,IsSoDisabled&includeRelations=Genre&orderBy=START_TIME%3Aa&filteravailability=false&includeAttributes=ca_cpvrDisable,ca_descriptors,ca_blackout_target,ca_blackout_areas&starttime=1737244800&endtime=1737331200&livechannelpids=lch5554&offset=0&limit=1000'
  )
})

it('can parse response', () => {
  const content = fs.readFileSync(path.resolve(__dirname, '__data__/content.json'))
  let results = parser({ content }).map(p => {
    p.start = p.start.toJSON()
    p.stop = p.stop.toJSON()
    return p
  })

  expect(results.length).toBe(44)
  expect(results[0]).toMatchObject({
    start: '2025-01-19T00:00:00.000Z',
    stop: '2025-01-19T00:30:00.000Z',
    title: 'Reavivados para a Missão',
    description:
      'Tudo sobre a missão com o Pastor Ted Wilson, líder mundial da Igreja Adventista do Sétimo Dia.',
    season: 25,
    episode: 3,
    images: [
      'http://media.gvp.telefonica.com/storageArea0/IMAGES/00/21/19/21190052_46294A7A7B0DF467.jpg'
    ]
  })
  expect(results[43]).toMatchObject({
    start: '2025-01-19T23:30:00.000Z',
    stop: '2025-01-20T00:00:00.000Z',
    title: 'A Máquina Humana',
    description:
      'O documentário explora a complexidade e a perfeição do corpo humano por meio de uma série de analogias com máquinas, olhando para a questão da saúde através das perspectivas da ciência, tecnologia e espiritualidade.',
    season: null,
    episode: null,
    images: [
      'http://media.gvp.telefonica.com/storageArea0/IMAGES/00/20/86/20864769_7DD013A4CCCF7899.jpg'
    ]
  })
})

it('can handle empty guide', () => {
  const content = fs.readFileSync(path.resolve(__dirname, '__data__/no_content.json'))
  const results = parser({ content })
  expect(results).toMatchObject([])
})
