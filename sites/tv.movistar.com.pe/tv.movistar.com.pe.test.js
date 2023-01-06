// npm run channels:parse -- --config=./sites/tv.movistar.com.pe/tv.movistar.com.pe.config.js --output=./sites/tv.movistar.com.pe/tv.movistar.com.pe.channels.xml
// npx epg-grabber --config=sites/tv.movistar.com.pe/tv.movistar.com.pe.config.js --channels=sites/tv.movistar.com.pe/tv.movistar.com.pe.channels.xml --output=guide.xml --days=2

const { parser, url, request } = require('./tv.movistar.com.pe.config.js')
const fs = require('fs')
const path = require('path')
const dayjs = require('dayjs')
const utc = require('dayjs/plugin/utc')
const customParseFormat = require('dayjs/plugin/customParseFormat')
dayjs.extend(customParseFormat)
dayjs.extend(utc)

const date = dayjs.utc('2022-11-29', 'YYYY-MM-DD').startOf('d')
const channel = {
  site_id: 'lch2219',
  xmltv_id: 'WillaxTV.pe'
}

it('can generate valid url', () => {
  expect(url({ channel, date })).toBe(
    'https://contentapi-pe.cdn.telefonica.com/28/default/es-PE/schedules?fields=Pid,Title,Description,ChannelName,LiveChannelPid,Start,End,images.videoFrame,AgeRatingPid&orderBy=START_TIME%3Aa&filteravailability=false&starttime=1669680000&endtime=1669766400&livechannelpids=lch2219'
  )
})

it('can parse response', () => {
  const content = fs.readFileSync(path.resolve(__dirname, '__data__/content.json'))
  let results = parser({ content, channel, date }).map(p => {
    p.start = p.start.toJSON()
    p.stop = p.stop.toJSON()
    return p
  })

  expect(results[0]).toMatchObject({
    start: '2022-11-28T23:50:00.000Z',
    stop: '2022-11-29T00:50:00.000Z',
    title: 'Willax noticias edición central',
    description:
      'Edición central con el desarrollo y cobertura noticiosa de todos los acontecimientos nacionales e internacionales.',
    icon: 'http://media.gvp.telefonica.com/storagearea0/IMAGES/00/13/00/13003906_281B2DAB18B01955.jpg'
  })
})

it('can handle empty guide', () => {
  const content = fs.readFileSync(path.resolve(__dirname, '__data__/no_content.json'))
  const result = parser({ content, channel, date })
  expect(result).toMatchObject([])
})
