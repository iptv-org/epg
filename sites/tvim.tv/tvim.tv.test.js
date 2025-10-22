const { parser, url } = require('./tvim.tv.config.js')
const fs = require('fs')
const path = require('path')
const dayjs = require('dayjs')
const utc = require('dayjs/plugin/utc')
const customParseFormat = require('dayjs/plugin/customParseFormat')
dayjs.extend(customParseFormat)
dayjs.extend(utc)

const date = dayjs.utc('2021-10-24', 'YYYY-MM-DD').startOf('d')
const channel = { site_id: 'T7', xmltv_id: 'T7.rs' }
const content = fs.readFileSync(path.resolve(__dirname, '__data__/content.json'))

it('can generate valid url', () => {
  const result = url({ date, channel })
  expect(result).toBe(
    'https://www.tvim.tv/script/program_epg?date=24.10.2021&prog=T7&server_time=true'
  )
})

it('can parse response', () => {
  const result = parser({ date, channel, content })
  expect(result).toMatchObject([
    {
      start: 'Sat, 23 Oct 2021 22:00:00 GMT',
      stop: 'Sun, 24 Oct 2021 02:00:00 GMT',
      title: 'Programi i T7',
      description: 'Programi i T7',
      category: 'test'
    }
  ])
})

it('can handle empty guide', () => {
  const result = parser({
    date,
    channel,
    content: fs.readFileSync(path.resolve(__dirname, '__data__/no_content.json'))
  })
  expect(result).toMatchObject([])
})
