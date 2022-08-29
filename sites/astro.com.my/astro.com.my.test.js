const { parser, url } = require('./astro.com.my.config.js')
const fs = require('fs')
const path = require('path')
const dayjs = require('dayjs')
const utc = require('dayjs/plugin/utc')
const customParseFormat = require('dayjs/plugin/customParseFormat')
dayjs.extend(customParseFormat)
dayjs.extend(utc)

const date = dayjs.utc('2022-08-30', 'YYYY-MM-DD').startOf('d')
const channel = {
  site_id: '235',
  xmltv_id: 'AstroArena.my'
}

it('can generate valid url', () => {
  expect(url({ channel })).toBe('https://contenthub-api.eco.astro.com.my/channel/235.json')
})

it('can parse response', () => {
  const content = fs.readFileSync(path.resolve(__dirname, '__data__/content.json'))
  const results = parser({ content, date }).map(p => {
    p.start = p.start.toJSON()
    p.stop = p.stop.toJSON()
    return p
  })

  expect(results.length).toBe(14)
  expect(results[0]).toMatchObject({
    start: '2022-08-29T16:00:00.000Z',
    stop: '2022-08-29T21:15:00.000Z',
    title: 'BWF Kejohanan Dunia 2022'
  })
})

it('can handle empty guide', () => {
  const content = fs.readFileSync(path.resolve(__dirname, '__data__/no_content.html'))
  const result = parser({ date, content })
  expect(result).toMatchObject([])
})
