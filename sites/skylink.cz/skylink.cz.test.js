// npx epg-grabber --config=sites/skylink.cz/skylink.cz.config.js --channels=sites/skylink.cz/skylink.cz_cz.channels.xml --output=guide.xml --days=2

const { parser, url, request } = require('./skylink.cz.config.js')
const fs = require('fs')
const path = require('path')
const dayjs = require('dayjs')
const utc = require('dayjs/plugin/utc')
const customParseFormat = require('dayjs/plugin/customParseFormat')
dayjs.extend(customParseFormat)
dayjs.extend(utc)
const axios = require('axios')
jest.mock('axios')

const channel = {
  site_id: '1',
  xmltv_id: 'CT1.cz'
}

it('can generate valid url for today', () => {
  const date = dayjs.utc().startOf('d')
  expect(url({ channel, date })).toBe('https://services.mujtvprogram.cz/tvprogram2services/services/tvprogrammelist_mobile.php?channel_cid=1&day=0')
})

it('can generate valid url for tomorrow', () => {
  const date = dayjs.utc().startOf('d').add(1, 'd')
  expect(url({ channel, date })).toBe('https://services.mujtvprogram.cz/tvprogram2services/services/tvprogrammelist_mobile.php?channel_cid=1&day=1')
})

it('can parse response', () => {
  const date = dayjs.utc('2022-12-23', 'YYYY-MM-DD').startOf('d')
  const content = `<?xml version="1.0" encoding="UTF-8"?><tv-program-programmes><programme><id>32288117</id><name>Čepice</name><premiere>0</premiere><widescreen>0</widescreen><stereo>0</stereo><blackWhite>0</blackWhite><subtitles>1</subtitles><hd>0</hd><fdbRating>0</fdbRating><fdbUrl>https://www.fdb.cz/film/bakalari-11-serie-13-dil-proc-ty-musis-vsechno-vyzvonit/127681</fdbUrl><shortDescription>TV film ČR (1983). O jednom netradičním vánočním překvapení. Scénář M. Najbrt. Kamera J. Plesník.</shortDescription><longDescription>Jarka (J. Bohdalová) vyčítá manželovi Jiřímu (F. Řehák), že jí nepomáhá při předvánočním úklidu. Vzápětí ale náhodou najde ve skříni ukrytou dámskou čepici a napadne ji, že jde o Jiřího dárek pro ni pod stromeček. Její chování se ihned změní. Jen muži naznačí, že by chtěla čepici jiné barvy. Manžel jí ovšem řekne, že čepici si u něj schoval kamarád Venca (M. Šulc). Zklamaná žena to prozradí Vencově manželce Božce (A. Tománková). Na Štědrý den však Božka najde pod stromečkem jen rtěnku...</longDescription><series>0</series><seriesId/><origin>CZE</origin><year>1983</year><duration>0</duration><directors>Mudra F.</directors><actors>Bohdalová J., Řehák F., Šulc M.</actors><date>23.12.2022</date><dateTimeInSec>1671750000</dateTimeInSec><startDate>23.12.2022 09:00</startDate><startDateTimeInSec>1671782400</startDateTimeInSec><startTime>09:00</startTime><endDate>23.12.2022 09:20</endDate><endDateTimeInSec>1671783600</endDateTimeInSec><endTime>09:20</endTime><pictures/><programme-type><id>3</id><name>film</name><tid>3</tid></programme-type></programme></tv-program-programmes>`

  let results = parser({ content }).map(p => {
    p.start = p.start.toJSON()
    p.stop = p.stop.toJSON()
    return p
  })
  
  expect(result).toMatchObject([
    {
      title: 'Čepice',
      description: `Jarka (J. Bohdalová) vyčítá manželovi Jiřímu (F. Řehák), že jí nepomáhá při předvánočním úklidu. Vzápětí ale náhodou najde ve skříni ukrytou dámskou čepici a napadne ji, že jde o Jiřího dárek pro ni pod stromeček. Její chování se ihned změní. Jen muži naznačí, že by chtěla čepici jiné barvy. Manžel jí ovšem řekne, že čepici si u něj schoval kamarád Venca (M. Šulc). Zklamaná žena to prozradí Vencově manželce Božce (A. Tománková). Na Štědrý den však Božka najde pod stromečkem jen rtěnku...`,
      category: 'film',
      date: '1983',
      director: 'Mudra F.',
      actor: ['Bohdalová J.', 'Řehák F.', 'Šulc M.'],
      start: '2022-12-23T08:00:00.000Z',
      stop: '2022-12-23T08:20:00.000Z'
    }
  ])  
 }
 
 it('can handle empty guide', () => {
  const result = parser(
    {
      content: `<?xml version="1.0" encoding="UTF-8" ?><tv-program-programmes></tv-program-programmes>`
    },
    channel
  )
  expect(result).toMatchObject([])
})
