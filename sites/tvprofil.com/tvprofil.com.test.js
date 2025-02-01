const { parser, url, request } = require('./tvprofil.com.config.js')
const fs = require('fs')
const path = require('path')
const dayjs = require('dayjs')
const utc = require('dayjs/plugin/utc')
const customParseFormat = require('dayjs/plugin/customParseFormat')
dayjs.extend(customParseFormat)
dayjs.extend(utc)

const date = dayjs.utc('2025-01-19', 'YYYY-MM-DD').startOf('d')
const channel = {
  site_id: 'bg/tv-programa#24kitchen-bg',
  xmltv_id: '24KitchenBulgaria.bg'
}

it('can generate valid url', () => {
  expect(url({ channel, date })).toBe(
    'https://tvprofil.com/bg/tv-programa/program/?datum=2025-01-19&kanal=24kitchen-bg&callback=cb&b52=824084'
  )
})

it('can generate valid request headers', () => {
  expect(request.headers).toMatchObject({
    'x-requested-with': 'XMLHttpRequest'
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
    title: 'Мексиканска кухня с Пати 10, еп. 9',
    start: '2023-01-12T04:00:00.000Z',
    stop: '2023-01-12T04:30:00.000Z'
  })
})

it('can handle empty guide', () => {
  const content = fs.readFileSync(path.resolve(__dirname, '__data__/no_content.txt'), 'utf8')

  expect(parser({ content })).toMatchObject([])
})
