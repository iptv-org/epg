// npx epg-grabber --config=sites/mujtvprogram.cz/mujtvprogram.cz.config.js --channels=sites/mujtvprogram.cz/mujtvprogram.cz.channels.xml --output=guide.xml --days=2

const { parser, url } = require('./mujtvprogram.cz.config.js')
const fs = require('fs')
const path = require('path')
const dayjs = require('dayjs')
const utc = require('dayjs/plugin/utc')
const customParseFormat = require('dayjs/plugin/customParseFormat')
dayjs.extend(customParseFormat)
dayjs.extend(utc)

const channel = {
  site_id: '1',
  xmltv_id: 'CT1.cz'
}

it('can generate valid url for today', () => {
  const date = dayjs.utc().startOf('d')
  expect(url({ channel, date })).toBe(
    'https://services.mujtvprogram.cz/tvprogram2services/services/tvprogrammelist_mobile.php?channel_cid=1&day=0'
  )
})

it('can generate valid url for tomorrow', () => {
  const date = dayjs.utc().startOf('d').add(1, 'd')
  expect(url({ channel, date })).toBe(
    'https://services.mujtvprogram.cz/tvprogram2services/services/tvprogrammelist_mobile.php?channel_cid=1&day=1'
  )
})

it('can parse response', () => {
  const content = fs.readFileSync(path.resolve(__dirname, '__data__/content.html'))

  let results = parser({ content }).map(p => {
    p.start = p.start.toJSON()
    p.stop = p.stop.toJSON()
    return p
  })
  expect(results[3]).toMatchObject({
    title: `Čepice`,
    description: `Jarka (J. Bohdalová) vyčítá manželovi Jiřímu (F. Řehák), že jí nepomáhá při předvánočním úklidu. Vzápětí ale náhodou najde ve skříni ukrytou dámskou čepici a napadne ji, že jde o Jiřího dárek pro ni pod stromeček. Její chování se ihned změní. Jen muži naznačí, že by chtěla čepici jiné barvy. Manžel jí ovšem řekne, že čepici si u něj schoval kamarád Venca (M. Šulc). Zklamaná žena to prozradí Vencově manželce Božce (A. Tománková). Na Štědrý den však Božka najde pod stromečkem jen rtěnku...`,
    category: 'film',
    date: '1983',
    director: ['Mudra F.'],
    actor: ['Bohdalová J.', 'Řehák F.', 'Šulc M.'],
    start: '2022-12-23T08:00:00.000Z',
    stop: '2022-12-23T08:20:00.000Z'
  })
})

it('can handle empty guide', () => {
  const content = fs.readFileSync(path.resolve(__dirname, '__data__/no_content.html'))
  const result = parser(content, channel)
  expect(result).toMatchObject([])
})
