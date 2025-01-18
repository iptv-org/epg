const { parser, url } = require('./freeview.co.uk.config.js')
const fs = require('fs')
const path = require('path')
const dayjs = require('dayjs')
const utc = require('dayjs/plugin/utc')
const customParseFormat = require('dayjs/plugin/customParseFormat')
dayjs.extend(customParseFormat)
dayjs.extend(utc)

const date = dayjs.utc('2025-01-16', 'YYYY-MM-DD').startOf('d')
const channel = {
  site_id: '64257#4164',
  xmltv_id: 'BBCOneLondon.uk'
}

it('can generate valid url', () => {
  expect(url({ date, channel })).toBe(
    'https://www.freeview.co.uk/api/tv-guide?nid=64257&start=1736985600'
  )
})

it('can parse response', () => {
  const content = fs.readFileSync(path.resolve(__dirname, '__data__/content.json'))
  let results = parser({ content, channel })
  results = results.map(p => {
    p.start = p.start.toJSON()
    p.stop = p.stop.toJSON()
    return p
  })

  expect(results.length).toBe(25)
  expect(results[0]).toMatchObject({
    start: '2025-01-16T00:00:00.000Z',
    stop: '2025-01-16T00:45:00.000Z',
    title: 'The Weakest Link',
    subtitle: 'Series 4: Episode 7',
    image: 'https://img.freeviewplay.tv/p0b041486e4378cbf074511098f74e78f?w=800'
  })
  expect(results[24]).toMatchObject({
    start: '2025-01-16T23:40:00.000Z',
    stop: '2025-01-17T00:10:00.000Z',
    title: 'Newscast',
    subtitle: 'Series 5: 16/01/2025',
    image: 'https://img.freeviewplay.tv/pb43e790fe10fe5ba668caf22224bc312?w=800'
  })
})

it('can handle empty guide', () => {
  const results = parser({
    content: '[]',
    channel
  })

  expect(results).toMatchObject([])
})
