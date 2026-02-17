const { url, parser } = require('./taiwanplus.com.config.js')
const fs = require('fs')
const path = require('path')
const dayjs = require('dayjs')
const utc = require('dayjs/plugin/utc')
dayjs.extend(utc)

const date = dayjs.utc('2023-08-20', 'YYYY-MM-DD').startOf('d')
const channel = {
  site_id: '#',
  xmltv_id: 'TaiwanPlusTV.tw',
  lang: 'en',
  logo: 'https://i.imgur.com/SfcZyqm.png'
}

it('can generate valid url', () => {
  expect(url({ channel, date })).toBe('https://www.taiwanplus.com/api/video/live/schedule/0')
})

it('can parse response', () => {
  const content = fs.readFileSync(path.resolve(__dirname, '__data__/content.json'))

  const results = parser({ content, date })

  expect(results).toMatchObject([
    {
      title: 'Master Class',
      start: dayjs.utc('2023/08/20 00:00', 'YYYY/MM/DD HH:mm'),
      stop: dayjs.utc('2023/08/21 00:00', 'YYYY/MM/DD HH:mm'),
      description:
        'From blockchain to Buddha statues, Taiwan’s culture is a kaleidoscope of old and new just waiting to be discovered.',
      image: 'https://prod-img.taiwanplus.com/live-schedule/Single/S30668_20230810104937.webp',
      category: 'TaiwanPlus ✕ Discovery',
      rating: '0+'
    }
  ])
})

it('can handle empty guide', () => {
  const results = parser({ content: '' })

  expect(results).toMatchObject([])
})
