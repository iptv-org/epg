const { parser, url } = require('./tv.dir.bg.config.js')
const fs = require('fs')
const path = require('path')
const dayjs = require('dayjs')
const utc = require('dayjs/plugin/utc')
const customParseFormat = require('dayjs/plugin/customParseFormat')
dayjs.extend(customParseFormat)
dayjs.extend(utc)

const date = dayjs.utc('2025-06-30', 'YYYY-MM-DD').startOf('d')
const channel = {
  site_id: '12',
  xmltv_id: 'BTV.bg'
}

it('can generate valid url', () => {
  expect(url({ channel, date })).toBe('https://tv.dir.bg/programa/12')
})

it('can parse response', () => {
  const content = fs.readFileSync(path.resolve(__dirname, '__data__/content.html'))
  const result = parser({ content, date }).map(p => {
    p.start = p.start.toJSON()
    p.stop = p.stop.toJSON()
    return p
  })

  expect(result).toMatchObject([
    {
      start: '2025-06-30T08:00:00.000Z',
      stop: '2025-06-30T10:00:00.000Z',
      title: 'Купа на Франция: Еспали - Пари Сен Жермен'
    },
    {
      start: '2025-06-30T10:00:00.000Z',
      stop: '2025-06-30T12:00:00.000Z',
      title: 'Ла Лига: Леганес - Реал Сосиедад'
    },
    {
      start: '2025-06-30T12:00:00.000Z',
      stop: '2025-06-30T13:00:00.000Z',
      title: 'Пред Стадиона&quot; - спортно шоу'
    }
  ])
})

it('can handle empty guide', () => {
  const result = parser({
    date,
    channel,
    content: fs.readFileSync(path.resolve(__dirname, '__data__/no_data.html'))
  })
  expect(result).toMatchObject([])
})
