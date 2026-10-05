const { parser, url } = require('./tvinsider.com.config.js')
const fs = require('fs')
const path = require('path')
const dayjs = require('dayjs')
const utc = require('dayjs/plugin/utc')
const customParseFormat = require('dayjs/plugin/customParseFormat')
dayjs.extend(customParseFormat)
dayjs.extend(utc)

const date = dayjs.utc('2025-01-18', 'YYYY-MM-DD').startOf('d')
const channel = {
  site_id: 'movieplex',
  xmltv_id: 'MoviePlexEast.us'
}

it('can generate valid url', () => {
  expect(url({ channel })).toBe('https://www.tvinsider.com/network/movieplex/schedule/')
})

it('can parse response', () => {
  const content = fs.readFileSync(path.resolve(__dirname, '__data__/content.html'))
  const results = parser({ content, date }).map(p => {
    p.start = p.start.toJSON()
    p.stop = p.stop.toJSON()
    return p
  })

  expect(results.length).toBe(15)
  expect(results[0]).toMatchObject({
    start: '2025-01-18T05:45:00.000Z',
    stop: '2025-01-18T07:12:00.000Z',
    title: 'Wild Oats',
    category: 'Feature Film',
    date: '2016',
    description:
      'Two best friends travel to the Canary Islands after one mistakenly receives a large amount of money.'
  })
  expect(results[14]).toMatchObject({
    start: '2025-01-19T04:42:00.000Z',
    stop: '2025-01-19T05:12:00.000Z',
    title: 'Trading Mom',
    category: 'Feature Film',
    date: '1994',
    description:
      'Kids (Anna Chlumsky, Aaron Michael Metchik) under magic spell shop for another mother.'
  })
})

it('can handle empty guide', () => {
  const results = parser({
    date,
    content: fs.readFileSync(path.resolve(__dirname, '__data__/no_content.html'))
  })

  expect(results).toMatchObject([])
})
