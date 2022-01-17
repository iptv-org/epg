// node ./scripts/commands/parse-channels.js --config=./sites/tvtv.us/tvtv.us.config.js --output=./sites/tvtv.us/tvtv.us_ca.channels.xml --set=country:ca
// npx epg-grabber --config=sites/tvtv.us/tvtv.us.config.js --channels=sites/tvtv.us/tvtv.us_ca-nb.channels.xml --output=guide.xml --days=2

const { parser, url, logo } = require('./tvtv.us.config.js')
const dayjs = require('dayjs')
const utc = require('dayjs/plugin/utc')
const customParseFormat = require('dayjs/plugin/customParseFormat')
dayjs.extend(customParseFormat)
dayjs.extend(utc)

const date = dayjs.utc('2022-01-17', 'YYYY-MM-DD').startOf('d')
const channel = {
  site_id: '62670',
  xmltv_id: 'AMITV.ca',
  logo: 'https://cdn.tvpassport.com/image/station/100x100/src.png'
}

it('can generate valid url', () => {
  expect(url({ channel, date })).toBe(
    'https://www.tvtv.us/gn/d/v1.1/stations/62670/airings?startDateTime=2022-01-17T00:00:00Z&endDateTime=2022-01-18T00:00:00Z'
  )
})

it('can get logo url', () => {
  expect(logo({ channel })).toBe('https://cdn.tvpassport.com/image/station/100x100/src.png')
})

it('can parse response', () => {
  const content = `[{"startTime":"2022-01-17T00:00Z","endTime":"2022-01-17T01:00Z","duration":60,"qualifiers":["CC","DVS","Stereo"],"program":{"tmsId":"SH010146820000","rootId":"811777","seriesId":"811777","subType":"Series","title":"Murdoch Mysteries","releaseYear":2008,"releaseDate":"2008-01-24","origAirDate":"2008-01-24","titleLang":"en","descriptionLang":"en","entityType":"Show","genres":["Drama","Mystery"],"longDescription":"Based on novels by Maureen Jennings, \\"Murdoch Mysteries\\" follows young detective William Murdoch. In a series of stories taking place in Toronto during the 1890s and early 1900s, several challenging murder cases arise. Murdoch uses up-and-coming forensics techniques and an unconventional approach, which often elicit skepticism from his fellow officers and his boss. Coroner Julia Ogden becomes Murdoch's number one ally, and they make a top-notch team, but he must struggle against tradition and prejudice to solve some of the city's most-gruesome murders.","shortDescription":"Detective William Murdoch uses radical techniques to solve murders.","topCast":["Yannick Bisson","Helene Joy","Jonny Harris"],"ratings":[{"body":"Mediakasvatus- ja kuvaohjelmayksikkö","code":"K16"},{"body":"Canadian Parental Rating","code":"PG"},{"body":"USA Parental Rating","code":"TVPG"},{"body":"Film & Publication Board","code":"13"},{"body":"Departamento de Justiça, Classificação, Títulos e Qualificação","code":"16","subRating":"Violência|Atos Criminosos"},{"body":"Australian Classification Board","code":"MA 15+"}],"preferredImage":{"width":"240","height":"360","uri":"assets/p20615554_b_v8_ab.jpg?w=240&h=360","category":"Banner-L1","text":"yes","primary":"true","tier":"Season"}},"station":{"stationId":"62670","callSign":"AMITV","videoQuality":{"signalType":"Digital","videoType":"SDTV"},"preferredImage":{"width":"360","height":"270","uri":"assets/s62670_ll_h15_ab.png?w=360&h=270","category":"Logo","primary":"true"}}}]`
  const result = parser({ content }).map(p => {
    p.start = p.start.toJSON()
    p.stop = p.stop.toJSON()
    return p
  })

  expect(result).toMatchObject([
    {
      start: '2022-01-17T00:00:00.000Z',
      stop: '2022-01-17T01:00:00.000Z',
      title: 'Murdoch Mysteries',
      description: `Based on novels by Maureen Jennings, \"Murdoch Mysteries\" follows young detective William Murdoch. In a series of stories taking place in Toronto during the 1890s and early 1900s, several challenging murder cases arise. Murdoch uses up-and-coming forensics techniques and an unconventional approach, which often elicit skepticism from his fellow officers and his boss. Coroner Julia Ogden becomes Murdoch's number one ally, and they make a top-notch team, but he must struggle against tradition and prejudice to solve some of the city's most-gruesome murders.`,
      category: ['Drama', 'Mystery'],
      icon: 'http://tvtv.tmsimg.com/assets/p20615554_b_v8_ab.jpg?w=240&h=360'
    }
  ])
})

it('can handle empty guide', () => {
  const result = parser({
    content: `[]`
  })
  expect(result).toMatchObject([])
})
