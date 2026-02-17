const { parser, url } = require('./programetv.ro.config.js')
const fs = require('fs')
const path = require('path')
const dayjs = require('dayjs')
const utc = require('dayjs/plugin/utc')
const customParseFormat = require('dayjs/plugin/customParseFormat')
dayjs.extend(customParseFormat)
dayjs.extend(utc)

const date = dayjs.utc('2021-10-24', 'YYYY-MM-DD').startOf('d')
const channel = { site_id: 'pro-tv', xmltv_id: 'ProTV.ro' }

it('can generate valid url', () => {
  const result = url({ date, channel })
  expect(result).toBe('https://www.programetv.ro/program-tv/pro-tv/duminica/')
})

it('can parse response', () => {
  const content = fs.readFileSync(path.resolve(__dirname, '__data__/content.html'), 'utf8')
  const result = parser({ date, channel, content })
  expect(result).toMatchObject([
    {
      start: '2021-11-07T05:00:00.000Z',
      stop: '2021-11-07T07:59:59.000Z',
      title: 'Ştirile Pro Tv',
      description:
        'În fiecare zi, cele mai importante evenimente, transmisiuni LIVE, analize, anchete şi reportaje sunt la Ştirile ProTV.',
      category: ['Ştiri'],
      icon: 'https://www.programetv.ro/img/shows/84/54/stirile-pro-tv.png?key=Z2lfZnVial90cmFyZXZwLzAwLzAwLzA1LzE4MzgxMnktMTIwazE3MC1hLW40NTk4MW9zLmNhdA=='
    }
  ])
})

it('can handle empty guide', () => {
  const result = parser({
    date,
    channel,
    content: fs.readFileSync(path.resolve(__dirname, '__data__/no_content.html'), 'utf8')
    
  })
  expect(result).toMatchObject([])
})
