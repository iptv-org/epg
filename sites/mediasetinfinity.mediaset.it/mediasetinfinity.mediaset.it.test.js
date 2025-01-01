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
  expect(
    url({
      channel,
      date
    })
  ).toBe(
    'https://api-ott-prod-fe.mediaset.net/PROD/play/feed/allListingFeedEpg/v2.0?byListingTime=1705708800000~1705795200000&byCallSign=LB'
  )
})

it('can parse response', () => {
  const content = fs.readFileSync(path.resolve(__dirname, '__data__/content.json'), 'utf8')
  const results = parser({ content, date }).map(p => {
    return p
  })

  expect(results[3]).toMatchObject({
    start: '2024-01-20 02:14',
    stop: '2024-01-20 02:54',
    title: 'Chicago Fire',
    sub_title: 'Ep. 22 - Io non ti lascio',
    description:
      'Severide e Kidd continuano a indagare su un vecchio caso doloso di Benny. Notizie inaspettate portano Brett a meditare su una grande decisione.',
    category: 'Intrattenimento',
    season: '7',
    episode: '22',
    image:
      'https://static2.mediasetplay.mediaset.it/Mediaset_Italia_Production_-_Main/F309370301002204/media/0/0/1ef76b73-3173-43bd-9c16-73986a0ec131/46896726-11e7-4438-b947-d2ae53f58c0b.jpg'
  })
})

it('can handle empty guide', () => {
  const result = parser({
    content: '[]'
  })
  expect(result).toMatchObject([])
})
