// npx epg-grabber --config=sites/mediaklikk.hu/mediaklikk.hu.config.js --channels=sites/mediaklikk.hu/mediaklikk.hu.channels.xml --output=guide.xml --days=2

const { parser, url, request } = require('./mediaklikk.hu.config.js')
const fs = require('fs')
const path = require('path')
const dayjs = require('dayjs')
const utc = require('dayjs/plugin/utc')
const customParseFormat = require('dayjs/plugin/customParseFormat')
dayjs.extend(customParseFormat)
dayjs.extend(utc)

const date = dayjs.utc('2022-03-10', 'YYYY-MM-DD').startOf('d')
const channel = {
  site_id: '3',
  xmltv_id: 'DuneTV.hu'
}

it('can generate valid url', () => {
  expect(url).toBe(
    'https://mediaklikk.hu/wp-content/plugins/hms-global-widgets/widgets/programGuide/programGuideInterface.php'
  )
})

it('can generate valid request method', () => {
  expect(request.method).toBe('POST')
})

it('can generate valid request headers', () => {
  expect(request.headers).toMatchObject({
    'Content-Type': 'application/x-www-form-urlencoded'
  })
})

it('can generate valid request data', () => {
  const result = request.data({ date, channel })
  expect(result.get('ChannelIds')).toBe('3,')
  expect(result.get('Date')).toBe('2022-03-10')
})

it('can parse response', () => {
  const content = fs.readFileSync(path.resolve(__dirname, '__data__/content.html'))
  const results = parser({ content }).map(p => {
    p.start = p.start.toJSON()
    p.stop = p.stop.toJSON()
    return p
  })

  expect(results[0]).toMatchObject({
    start: '2022-10-27T22:00:46.000Z',
    stop: '2022-10-27T22:54:00.000Z',
    title: `A hegyi doktor - I. évad`,
    description:
      'Maxl iskolatársának, Vroninak az anyja egy autóbalesetben meghal. A 20 éves testvér, Vinzenz magához szeretné venni a lányt, ám a gyámüggyel problémái akadnak, ezért megpróbálja elszöktetni.(Eredeti hang digitálisan.)',
    icon: 'https://mediaklikk.hu/wp-content/uploads/sites/4/2019/10/A-hegyi-doktor-I-évad-e1571318391226-150x150.jpg'
  })

  expect(results[56]).toMatchObject({
    start: '2022-10-28T20:35:05.000Z',
    stop: '2022-10-28T21:05:05.000Z',
    title: `Szemtől szemben (1967)`,
    description:
      'Brad Fletcher bostoni történelemtanár, aki a délnyugati határvidéken kúrálja tüdőbetegségét, egy véletlen folytán összeakad Beauregard Bennett körözött útonállóval, akit végül maga segít a menekülésben. A tanárt lenyűgözi a törvényen kívüliek világa és felismeri, hogy értelmi felsőbbrendűségével bámulatosan tudja irányítani az embereket. Bennett csakhamar azt veszi észre, hogy a peremre szorult saját bandájában. Eközben a Pinkerton ügynökség beépített embere is csapdába igyekszik csalni mindnyájukat.'
  })
})

it('can handle empty guide', () => {
  const result = parser({
    date,
    channel,
    content: `<!DOCTYPE html><html><head></head><body></body></html>`
  })
  expect(result).toMatchObject([])
})
