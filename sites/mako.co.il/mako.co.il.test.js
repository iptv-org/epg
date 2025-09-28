const { parser, url } = require('./mako.co.il.config.js')
const fs = require('fs')
const path = require('path')
const dayjs = require('dayjs')
const utc = require('dayjs/plugin/utc')
const customParseFormat = require('dayjs/plugin/customParseFormat')
dayjs.extend(customParseFormat)
dayjs.extend(utc)

const date = dayjs.utc('2022-03-07', 'YYYY-MM-DD').startOf('d')

it('can generate valid url', () => {
  expect(url).toBe('https://www.mako.co.il/AjaxPage?jspName=EPGResponse.jsp')
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
      start: '2022-03-07T00:38:00.000Z',
      stop: '2022-03-07T00:39:00.000Z',
      title: 'רוקדים עם כוכבים - בר זומר',
      description: 'מהדורת החדשות המרכזית של הבוקר, האנשים הפרשנויות והכותרות שיעשו את היום.',
      image: 'https://img.mako.co.il/2022/02/13/DancingWithStars2022_EPG.jpg'
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
