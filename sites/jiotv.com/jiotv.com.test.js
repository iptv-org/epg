const { parser, url } = require('./jiotv.com.config.js')
const fs = require('fs')
const path = require('path')
const dayjs = require('dayjs')
const utc = require('dayjs/plugin/utc')
const customParseFormat = require('dayjs/plugin/customParseFormat')
dayjs.extend(customParseFormat)
dayjs.extend(utc)

jest.useFakeTimers().setSystemTime(new Date('2025-01-15'))

const date = dayjs.utc('2025-01-17', 'YYYY-MM-DD').startOf('d')
const channel = {
  site_id: '146',
  xmltv_id: 'HistoryTV18HD.in'
}

it('can generate valid url', () => {
  expect(url({ date, channel })).toBe(
    'https://jiotvapi.cdn.jio.com/apis/v1.3/getepg/get?channel_id=146&offset=2'
  )
})

it('can parse response', () => {
  const content = fs.readFileSync(path.resolve(__dirname, '__data__/content.json'), 'utf8')
  let results = parser({ content })
  results = results.map(p => {
    p.start = p.start.toJSON()
    p.stop = p.stop.toJSON()
    return p
  })

  expect(results.length).toBe(46)
  expect(results[1]).toMatchObject({
    start: '2025-01-16T19:13:00.000Z',
    stop: '2025-01-16T19:57:00.000Z',
    title: "History's Greatest Heists With Pierce Brosnan",
    description:
      "Daring criminals burrow beneath London's streets to infiltrate a Lloyds Bank vault. However, their heist takes an unexpected turn when a radio hobbyist stumbles upon their communications.",
    categories: ['History'],
    directors: ['Brendan G Murphy'],
    actors: ['Brent Picha', 'William Sibley', 'Bobby Williams'],
    episode: 3,
    keywords: [
      'Heist',
      'Criminal mastermind',
      'Consequences',
      'Historical account',
      'Historical significance',
      'Criminal offence'
    ],
    icon: 'https://jiotvimages.cdn.jio.com/dare_images/shows/700/-/2025-01-17/250117146001_s.jpg',
    image: 'https://jiotvimages.cdn.jio.com/dare_images/shows/700/-/2025-01-17/250117146001.jpg'
  })
  expect(results[45]).toMatchObject({
    start: '2025-01-17T18:29:00.000Z',
    stop: '2025-01-17T18:29:59.000Z',
    title: "History's Greatest Escapes with Morgan Freeman",
    description:
      'In French Guiana, when petty thief Rene Belbenoit faces harsh imprisonment, determined to break free, he endures years of gruelling conditions and attempts numerous daring escapes.',
    categories: ['Crime'],
    directors: ['Mitch Marcus'],
    actors: [],
    episode: 5,
    keywords: [
      'Imprisoned',
      'Prison',
      'Prison Break',
      'Prison film',
      'Set in a prison',
      'Escape',
      'Survival',
      'Survival Instinct'
    ],
    icon: 'https://jiotvimages.cdn.jio.com/dare_images/shows/700/-/2025-01-17/250117146045_s.jpg',
    image: 'https://jiotvimages.cdn.jio.com/dare_images/shows/700/-/2025-01-17/250117146045.jpg'
  })
})

it('can handle empty guide', () => {
  const results = parser({
    content: ''
  })

  expect(results).toMatchObject([])
})
