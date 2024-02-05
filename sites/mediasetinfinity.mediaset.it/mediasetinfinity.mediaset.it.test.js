const { parser, url } = require('./mediasetinfinity.mediaset.it.config.js')
const fs = require('fs')
const path = require('path')
const dayjs = require('dayjs')
const utc = require('dayjs/plugin/utc')
const customParseFormat = require('dayjs/plugin/customParseFormat')
dayjs.extend(customParseFormat)
dayjs.extend(utc)

const date = dayjs.utc('2024-01-20', 'YYYY-MM-DD').startOf('d')
const channel = {
  site_id: 'LB',
  xmltv_id: '20.it'
}

it('can generate valid url', () => {
  expect(url({ channel, date })).toBe(
    'https://api-ott-prod-fe.mediaset.net/PROD/play/feed/allListingFeedEpg/v2.0?byListingTime=1705708800000~1705795200000&byCallSign=LB'
  )
})

it('can parse response', () => {
  const content = fs.readFileSync(path.resolve(__dirname, '__data__/content.json'), 'utf8')
  const results = parser({ content, date }).map(p => {
    return p
  })

  expect(results[0]).toMatchObject({
    start: '2024-01-19 22:37',
    stop: '2024-01-20 00:54',
    title: 'Independence day: Rigenerazione',
    description: 'Sequel del film di fantascienza Independence Day, con L. Hemsworth e B. Pullman. Dopo 20 anni la Terra si prepara a subire un secondo, terrificante attacco alieno.',
  })
})

it('can handle empty guide', () => {
  const result = parser({
    content: '[]'
  })
  expect(result).toMatchObject([])
})
