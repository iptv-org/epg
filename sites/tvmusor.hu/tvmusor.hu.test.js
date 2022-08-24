// node ./scripts/channels.js --config=./sites/tvmusor.hu/tvmusor.hu.config.js --output=./sites/tvmusor.hu/tvmusor.hu_hu.channels.xml
// npx epg-grabber --config=sites/tvmusor.hu/tvmusor.hu.config.js --channels=sites/tvmusor.hu/tvmusor.hu_hu.channels.xml --output=guide.xml --days=2

const { parser, url, request } = require('./tvmusor.hu.config.js')
const dayjs = require('dayjs')
const utc = require('dayjs/plugin/utc')
const customParseFormat = require('dayjs/plugin/customParseFormat')
dayjs.extend(customParseFormat)
dayjs.extend(utc)

const date = dayjs.utc('2021-11-24', 'YYYY-MM-DD').startOf('d')
const channel = {
  site_id: '139',
  xmltv_id: 'AMCHungary.hu'
}

it('can generate valid url', () => {
  expect(url).toBe('http://www.tvmusor.hu/a/get-events/')
})

it('can generate valid request method', () => {
  expect(request.method).toBe('POST')
})

it('can generate valid request headers', () => {
  expect(request.headers).toMatchObject({
    'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8'
  })
})

it('can generate valid request data', () => {
  const result = request.data({ channel, date })
  expect(result.get('data')).toBe('{"blocks":["139|2021-11-24"]}')
})

it('can parse response', () => {
  const content = `{"status":"success","data":{"time":0.00033187866210938,"loadedBlocks":{"139_2021-11-24":[{"a":903037163,"b":167085,"c":"Milyen volt a vil\\u00e1g, amikor elkezdett \\u00e1talakulni azz\\u00e1 a horrorisztikus apokalipsziss\\u00e9, amelyet a The Walking Dead festett le? A Los Angeles-ben j\\u00e1tsz\\u00f3d\\u00f3 t\\u00e1rs-sorozat pontosan erre a k\\u00e9rd\\u00e9sre v\\u00e1laszol.","d":65,"e":1637712900000,"f":1637716800000,"g":2021,"h":"filmsorozat","i":"1:15","j":"Fear the Walking Dead","l":"18","n":"fear-the-walking-dead","z":"d6310651d2be559cc4e49498a21edd7477c19244_6345563D34F3542B1649E80.jpg"}]}}}`
  const result = parser({ content, channel, date }).map(p => {
    p.start = p.start.toJSON()
    p.stop = p.stop.toJSON()
    return p
  })

  expect(result).toMatchObject([
    {
      start: '2021-11-24T00:15:00.000Z',
      stop: '2021-11-24T01:20:00.000Z',
      title: `Fear the Walking Dead`,
      category: 'filmsorozat',
      description: `Milyen volt a világ, amikor elkezdett átalakulni azzá a horrorisztikus apokalipszissé, amelyet a The Walking Dead festett le? A Los Angeles-ben játszódó társ-sorozat pontosan erre a kérdésre válaszol.`,
      icon: 'http://www.tvmusor.hu/images/events/408/d6310651d2be559cc4e49498a21edd7477c19244_6345563D34F3542B1649E80.jpg'
    }
  ])
})

it('can handle empty guide', () => {
  const result = parser({
    date,
    channel,
    content: `{"status":"error","reason":"invalid blocks"}`
  })
  expect(result).toMatchObject([])
})
