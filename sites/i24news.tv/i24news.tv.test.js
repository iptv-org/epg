const { parser, url } = require('./i24news.tv.config.js')
const fs = require('fs')
const path = require('path')
const dayjs = require('dayjs')
const utc = require('dayjs/plugin/utc')
const customParseFormat = require('dayjs/plugin/customParseFormat')
dayjs.extend(customParseFormat)
dayjs.extend(utc)

const date = dayjs.utc('2022-03-06', 'YYYY-MM-DD').startOf('d')
const channel = {
  site_id: 'ar',
  xmltv_id: 'I24NewsArabic.il'
}

it('can generate valid url', () => {
  expect(url({ channel })).toBe('https://api.i24news.tv/v2/ar/schedules')
})

it('can parse response', () => {
  const content = fs.readFileSync(path.resolve(__dirname, '__data__/content.json'))
  const result = parser({ content, date }).map(p => {
    p.start = p.start.toJSON()
    p.stop = p.stop.toJSON()
    return p
  })

  expect(result).toMatchObject([
    {
      start: '2022-03-06T13:00:00.000Z',
      stop: '2022-03-06T13:28:00.000Z',
      title: 'تغطية خاصة',
      description: 'Special Edition',
      image:
        'https://cdn.i24news.tv/uploads/a1/be/85/20/69/6f/32/1c/ed/b0/f8/5c/f6/1c/40/f9/a1be8520696f321cedb0f85cf61c40f9.png'
    }
  ])
})

it('can handle empty guide', () => {
  const result = parser({
    content: '[]',
    date
  })
  expect(result).toMatchObject([])
})
