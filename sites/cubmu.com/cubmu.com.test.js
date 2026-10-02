const { url, parser } = require('./cubmu.com.config.js')
const fs = require('fs')
const path = require('path')
const dayjs = require('dayjs')
const utc = require('dayjs/plugin/utc')

dayjs.extend(utc)

const date = dayjs.utc('2026-04-26').startOf('d')
const channel = { site_id: '210', xmltv_id: 'TransTV.id', lang: 'id' }

it('can generate valid url', () => {
  expect(url({ channel, date })).toBe(
    'https://servicebuss.transvision.co.id/global/v2/epg/programs?channel_id=210&schedule_date=2026-04-26'
  )
})

it('can parse response', () => {
  const content = fs.readFileSync(path.resolve(__dirname, '__data__/content.json'), 'utf8')
  const results = parser({ content, channel })
    .map(p => {
      p.start = p.start.toJSON()
      p.stop = p.stop.toJSON()
      return p
    })
  expect(results[4]).toMatchObject({
    title: 'Adam And Inul Love Story',
    start: '2026-04-25T21:40:00.000Z',
    stop: '2026-04-25T22:00:00.000Z',
  })
})

it('can handle empty guide', () => {
  const results = parser({ content: '' })

  expect(results).toMatchObject([])
})
