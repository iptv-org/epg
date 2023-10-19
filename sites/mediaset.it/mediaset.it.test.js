// npm run grab -- --site=mediaset.it

const { parser, url } = require('./mediaset.it.config.js')
const fs = require('fs')
const path = require('path')
const dayjs = require('dayjs')
const utc = require('dayjs/plugin/utc')
const customParseFormat = require('dayjs/plugin/customParseFormat')
dayjs.extend(customParseFormat)
dayjs.extend(utc)

const date = dayjs.utc('2023-10-20', 'YYYY-MM-DD').startOf('d')
const channel = {
  site_id: 'LB',
  xmltv_id: '20.it'
}

it('can generate valid url', () => {
  expect(url({ channel, date })).toBe(
    'http://www.mediaset.it/guidatv/inc/canali/202310/20231020_LB.sjson'
  )
})

it('can parse response', () => {
  const content = fs.readFileSync(path.resolve(__dirname, '__data__/content.json'), 'utf8')
  const results = parser({ content, date }).map(p => {
    p.start = p.start.toJSON()
    p.stop = p.stop.toJSON()
    return p
  })

  expect(results[0]).toMatchObject({
    start: '2023-10-20T04:10:00.000Z',
    stop: '2023-10-20T05:07:00.000Z',
    title: 'Showreel',
    description: 'INTRATTENIMENTO 15 - Italia, 2023',
    category: 'INTRATTENIMENTO'
  })
})

it('can handle empty guide', () => {
  const result = parser({
    content: fs.readFileSync(path.resolve(__dirname, '__data__/no_content.html'), 'utf8')
  })
  expect(result).toMatchObject([])
})
