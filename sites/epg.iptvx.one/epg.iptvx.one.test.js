const { parser, url } = require('./epg.iptvx.one.config.js')
const dayjs = require('dayjs')
const utc = require('dayjs/plugin/utc')
const timezone = require('dayjs/plugin/timezone')
const fs = require('fs')
const path = require('path')

dayjs.extend(utc)
dayjs.extend(timezone)

const date = dayjs.utc('2025-01-13', 'YYYY-MM-DD').startOf('d')
const channel = { site_id: '12-omsk', xmltv_id: 'Channel12.ru' }

it('can generate valid url', () => {
  expect(url).toBe('https://iptvx.one/epg/epg_noarch.xml.gz')
})

it('can parse response', () => {
  const buffer = fs.readFileSync(path.resolve(__dirname, '__data__/content.xml.gz'))
  const results = parser({ date, buffer, channel })

  expect(results.length).toBe(29)
  expect(results[0]).toMatchObject({
    start: '2025-01-13T00:00:00.000Z',
    stop: '2025-01-13T00:55:00.000Z',
    title: 'Акценты недели',
    description:
      'Программа расскажет зрителям о том, как развивались самые яркие события недели, поможет расставить акценты над самыми обсуждаемыми новостями. Россия, ток-шоу'
  })
  expect(results[28]).toMatchObject({
    start: '2025-01-13T22:15:00.000Z',
    stop: '2025-01-14T00:00:00.000Z',
    title: 'д/с Необыкновенные люди',
    description:
      'Герои цикла – врачи, спортсмены, представители творческих профессий, волонтеры и многие-многие другие. Их деятельность связана с жизнью особенных людей. Россия, док. сериал'
  })
})

it('can handle empty guide', () => {
  const result = parser({
    date,
    channel,
    buffer: ''
  })
  expect(result).toMatchObject([])
})
