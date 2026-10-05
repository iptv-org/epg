const { parser, url } = require('./tv.movistar.co.config.js')
const fs = require('fs')
const path = require('path')
const dayjs = require('dayjs')
const utc = require('dayjs/plugin/utc')
const customParseFormat = require('dayjs/plugin/customParseFormat')
dayjs.extend(customParseFormat)
dayjs.extend(utc)

const date = dayjs.utc('2026-04-09', 'YYYY-MM-DD').startOf('d')
const channel = { site_id: 'lch2703' }

it('can generate valid url', () => {
  expect(url({ channel, date })).toBe(
    'https://contentapi-co.cdn.telefonica.com/33/default/es-CO/schedules?ca_deviceTypes=null%7C401&ca_channelmaps=166%7Cnull&fields=Pid,Title,Description,ChannelName,ChannelNumber,CallLetter,Start,End,EpgNetworkDvr,LiveChannelPid,LiveProgramPid,EpgSerieId,SeriesPid,SeriesId,SeasonPid,SeasonNumber,images.videoFrame,images.banner,LiveToVod,AgeRatingPid,forbiddenTechnology,IsSoDisabled&includeRelations=Genre&orderBy=START_TIME%3Aa&filteravailability=false&includeAttributes=ca_cpvrDisable,ca_descriptors,ca_blackout_target,ca_blackout_areas&starttime=1775692800&endtime=1775779200&livechannelpids=lch2703&offset=0&limit=1000'
  )
})

it('can parse response', () => {
  const content = fs.readFileSync(path.resolve(__dirname, '__data__/content.json'))

  const results = parser({ content }).map(p => {
    p.start = p.start.toJSON()
    p.stop = p.stop.toJSON()

    return p
  })

  expect(results.length).toBe(37)
  expect(results[0]).toMatchObject({
    title: 'Detrás de Cámara',
    description: '',
    images: [
      'http://media.gvp.telefonica.com/storageArea0/IMAGES/00/16/09/16095899_A8F9881B31839708.jpg'
    ],
    start: '2026-04-08T23:30:00.000Z',
    stop: '2026-04-09T00:00:00.000Z'
  })
})

it('can handle empty guide', () => {
  const content = fs.readFileSync(path.resolve(__dirname, '__data__/no_content.json'))
  const results = parser({ content })

  expect(results).toMatchObject([])
})
