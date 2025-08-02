const { parser, url, request } = require('./tvprofil.com.config.js')
const fs = require('fs')
const path = require('path')
const dayjs = require('dayjs')
const utc = require('dayjs/plugin/utc')
const customParseFormat = require('dayjs/plugin/customParseFormat')
dayjs.extend(customParseFormat)
dayjs.extend(utc)

const date = dayjs.utc('2025-07-29', 'YYYY-MM-DD').startOf('d')
const channel = {
  site_id: 'bg/tv-programa#24kitchen-bg',
  xmltv_id: '24KitchenBulgaria.bg'
}

it('can generate valid url', () => {
  expect(url({ channel, date })).toBe(
    'https://tvprofil.com/bg/tv-programa/program/?datum=2025-07-29&kanal=24kitchen-bg&callback=tvprogramit48&b48=827670'
  )
})

it('can generate valid request headers', () => {
  expect(request.headers).toMatchObject({
    'x-requested-with': 'XMLHttpRequest',
    'referer': 'https://tvprofil.com/tvprogram/',
  })
})

it('can parse response', () => {
  const content = fs.readFileSync(path.resolve(__dirname, '__data__/content.txt'), 'utf8')
  const results = parser({ content }).map(p => {
    p.start = p.start.toJSON()
    p.stop = p.stop.toJSON()
    return p
  })

  expect(results[0]).toMatchObject({
    title: 'Save with Jamie 1, ep. 2',
    start: '2025-07-29T05:00:00.000Z',
    stop: '2025-07-29T06:00:00.000Z'
  })
})

it('can handle empty guide', () => {
  const content = fs.readFileSync(path.resolve(__dirname, '__data__/no_content.txt'), 'utf8')

  expect(parser({ content })).toMatchObject([])
})
