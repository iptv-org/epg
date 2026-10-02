const { parser, url } = require('./port.hu.config.js')
const fs = require('fs')
const path = require('path')
const dayjs = require('dayjs')
const utc = require('dayjs/plugin/utc')
const customParseFormat = require('dayjs/plugin/customParseFormat')
dayjs.extend(customParseFormat)
dayjs.extend(utc)

const date = dayjs.utc('2025-11-10', 'YYYY-MM-DD').startOf('d')
const channel = { site_id: '5' }

it('can generate valid url', () => {
  expect(url({ channel, date })).toBe(
    'https://port.hu/tvapi?channel_id[]=tvchannel-5&i_datetime_from=2025-11-10&i_datetime_to=2025-11-10'
  )
})

it('can parse response', () => {
  const content = fs.readFileSync(path.resolve(__dirname, '__data__/content.json'))

  const results = parser({ content, channel }).map(p => {
    p.start = p.start.toJSON()
    p.stop = p.stop.toJSON()

    return p
  })

  expect(results.length).toBe(25)
  expect(results[0]).toMatchObject({
    title: 'Terhes társaság',
    description: 'amerikai vígjáték, 2010',
    category: 'film',
    start: '2025-11-09T21:40:00.000Z',
    stop: '2025-11-09T23:45:00.000Z'
  })
  expect(results[24]).toMatchObject({
    title: 'CSI: A helyszínelők',
    subtitle: 'Bukott bálványok',
    description: 'amerikai-kanadai krimisorozat, VII / 17. rész, 2007',
    category: 'filmsorozat',
    start: '2025-11-11T01:50:00.000Z',
    stop: '2025-11-11T03:00:00.000Z'
  })
})

it('can handle empty guide', () => {
  const content = fs.readFileSync(path.resolve(__dirname, '__data__/no_content.json'))
  const results = parser({ content, channel })

  expect(results).toMatchObject([])
})
