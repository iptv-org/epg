// node ./scripts/commands/parse-channels.js --config=./sites/tvtv.us/tvtv.us.config.js --output=./sites/tvtv.us/tvtv.us_ca.channels.xml --set=country:ca
// npx epg-grabber --config=sites/tvtv.us/tvtv.us.config.js --channels=sites/tvtv.us/tvtv.us_ca-nb.channels.xml --output=guide.xml --days=2

const { parser, url } = require('./tvtv.us.config.js')
const dayjs = require('dayjs')
const utc = require('dayjs/plugin/utc')
const customParseFormat = require('dayjs/plugin/customParseFormat')
dayjs.extend(customParseFormat)
dayjs.extend(utc)

const date = dayjs.utc('2022-01-17', 'YYYY-MM-DD').startOf('d')
const channel = {
  site_id: '62670',
  xmltv_id: 'AMITV.ca'
}

it('can generate valid url', () => {
  expect(url({ channel, date })).toBe(
    'https://www.tvtv.us/gn/d/v1.1/stations/62670/airings?startDateTime=2022-05-12T00:00:00Z&endDateTime=2022-05-13T00:00:00Z'
  )
})

it('can parse response', () => {
  const content = `[{"startTime":"2022-05-12T03:00Z","endTime":"2022-05-12T03:30Z","duration":30,"qualifiers":["CC","DVS"],"program":{"tmsId":"EP031727440001","rootId":"16640530","seriesId":"16640522","subType":"Series","title":"Reflect and Renew With Kevin Naidoo","episodeTitle":"Self-Love","releaseYear":2019,"releaseDate":"2019-03-16","origAirDate":"2019-03-16","titleLang":"en","descriptionLang":"en","entityType":"Episode","genres":["Health"],"longDescription":"Kevin demonstrates judgement-free, self-love through discussion, meditation and yoga.","shortDescription":"Kevin demonstrates judgement-free, self-love through discussion, meditation and yoga.","episodeNum":1,"seasonNum":1,"topCast":["Kevin Naidoo"],"ratings":[{"body":"Canadian Parental Rating","code":"G"},{"body":"USA Parental Rating","code":"TVG"},{"body":"Régie du cinéma","code":"G"}],"preferredImage":{"width":"240","height":"360","uri":"assets/p16640522_b_v9_aa.jpg?w=240\u0026h=360","category":"Banner-L2","text":"yes","primary":"true","tier":"Series"}},"station":{"stationId":"62670","callSign":"AMITV","videoQuality":{"signalType":"Digital","videoType":"SDTV"},"preferredImage":{"width":"360","height":"270","uri":"assets/s62670_ll_h15_ab.png?w=360\u0026h=270","category":"Logo","primary":"true"}}},{"startTime":"2022-05-12T03:30Z","endTime":"2022-05-12T04:00Z","duration":30,"qualifiers":["CC","DVS"],"program":{"tmsId":"EP018574900052","rootId":"12724343","seriesId":"10464580","subType":"Series","title":"Four Senses","episodeTitle":"Cheesy","releaseYear":2016,"releaseDate":"2016-04-07","origAirDate":"2016-03-18","titleLang":"en","descriptionLang":"en","entityType":"Episode","genres":["House/garden"],"longDescription":"Christine and Carl get cheesy with Frankie 'Flowers' Ferragine.","shortDescription":"Christine and Carl get cheesy with Frankie 'Flowers' Ferragine.","episodeNum":13,"seasonNum":3,"topCast":["Carl Heinrich","Christine Ha"],"ratings":[{"body":"Canadian Parental Rating","code":"G"},{"body":"USA Parental Rating","code":"TVG"},{"body":"Régie du cinéma","code":"G"}],"preferredImage":{"width":"240","height":"360","uri":"assets/p10464580_b_v7_aa.jpg?w=240\u0026h=360","category":"Banner-L1","text":"yes","primary":"true","tier":"Series"}},"station":{"stationId":"62670","callSign":"AMITV","videoQuality":{"signalType":"Digital","videoType":"SDTV"},"preferredImage":{"width":"360","height":"270","uri":"assets/s62670_ll_h15_ab.png?w=360\u0026h=270","category":"Logo","primary":"true"}}}]`

  const result = parser({ content }).map(p => {
    p.start = p.start.toJSON()
    p.stop = p.stop.toJSON()
    return p
  })

  expect(result).toMatchObject([
    {
      start: '2022-01-20T00:00:00.000Z',
      stop: '2022-01-20T00:30:00.000Z',
      title: 'Reflect and Renew With Kevin Naidoo',
      sub_title: 'Self-Love',
      description: 'Kevin demonstrates a meditation and yoga practice to reclaim his courage and confidence.'
      category: ['Health']
      actor: ['Kevin Naidoo']
      season: 1
      episode: 6
      icon: 'http://tvtv.tmsimg.com/assets/p16640522_b_v9_aa.jpg?w=240&h=360'
    },
    { 
      start: '2022-05-12T03:30Z',
      stop: '2022-05-12T04:00Z',
      title: 'Four Senses',
      description: `Everything is sizzled and seared as chef Corbin Tomaszeski joins Christine and Carl in the kitchen.`,
      category: ['House/garden'],
      icon: 'http://tvtv.tmsimg.com/assets/p10464580_b_v7_aa.jpg?w=240&h=360'
    }
  ])
})

it('can handle empty guide', () => {
  const result = parser({
    content: `[]`
  })
  expect(result).toMatchObject([])
})
