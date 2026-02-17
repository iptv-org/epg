const { parser, url } = require('./iltalehti.fi.config.js')
const fs = require('fs')
const path = require('path')
const dayjs = require('dayjs')
const utc = require('dayjs/plugin/utc')
const customParseFormat = require('dayjs/plugin/customParseFormat')
dayjs.extend(customParseFormat)
dayjs.extend(utc)

const date = dayjs.utc('2025-12-13', 'YYYY-MM-DD').startOf('d')
const channel = {
  site_id: 'd63736b5-7f72-45d4-8f9e-6505f1bac855#391',
  xmltv_id: 'YleTV1.fi'
}

it('can generate valid url', () => {
  expect(url({ channel, date })).toBe(
    'https://il-telkku-api.prod.il.fi/v1/channel-groups/d63736b5-7f72-45d4-8f9e-6505f1bac855/offering?startTime=2025-12-13T00%3A00%3A00%2B00%3A00&endTime=2025-12-14T00%3A00%3A00%2B00%3A00'
  )
})

it('can parse response', () => {
  const content = fs.readFileSync(path.resolve(__dirname, '__data__/content.json'))
  const results = parser({ content, channel }).map(p => {
    p.start = p.start.toJSON()
    p.stop = p.stop.toJSON()
    return p
  })

  expect(results[0]).toMatchObject({
    start: '2025-12-14T05:00:00.000Z',
    stop: '2025-12-14T05:40:00.000Z',
    title: 'Ykkösaamu',
    description:
      'Ykkösaamu kysyy lauantaiaamuisin suoraan eturivin vallanpitäjiltä "mitä, miksi ja miten niin". Suoraan lähetykseen otetaan runsaasti yleisökysymyksiä. Niitä keräävä juttu julkaistaan lähetystä edeltävänä torstaina Ylen uutissivustolla.',
    image: 'https://img.ilcdn.fi/l7KNdhfXm1VQ_hDY1pI954wDzT8=/612x382/smart/filters:quality(86)/il-telkku-image.prod.il.fi%2F13692029611179385660'
  })
})

it('can handle empty guide', () => {
  const result = parser({
    content: fs.readFileSync(path.resolve(__dirname, '__data__/no-content.json')),
    channel
  })
  expect(result).toMatchObject([])
})
