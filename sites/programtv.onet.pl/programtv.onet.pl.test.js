const { parser, url } = require('./programtv.onet.pl.config.js')
const axios = require('axios')
const fs = require('fs')
const path = require('path')
const dayjs = require('dayjs')
const utc = require('dayjs/plugin/utc')
const customParseFormat = require('dayjs/plugin/customParseFormat')
dayjs.extend(customParseFormat)
dayjs.extend(utc)

jest.mock('axios')

axios.get.mockImplementation(url => {
  if (url === 'https://programtv.onet.pl/tv/law-and-order-odcinek-15/rlmzu?entry=21970867') {
    return Promise.resolve({
      data: fs.readFileSync(path.resolve(__dirname, '__data__/entry.html'))
    })
  } else {
    return Promise.resolve({
      data: ''
    })
  }
})

const date = dayjs.utc('2021-11-24', 'YYYY-MM-DD').startOf('d')
const channel = {
  site_id: '13th-street-250',
  xmltv_id: '13thStreet.de'
}

beforeEach(() => {
  jest.useFakeTimers()
})

afterEach(() => {
  jest.useRealTimers()
})

it('can generate valid url', () => {
  jest.setSystemTime(dayjs.utc('2021-11-24', 'YYYY-MM-DD').startOf('d').valueOf())
  expect(url({ channel, date })).toBe(
    'https://programtv.onet.pl/program-tv/13th-street-250?dzien=0'
  )
})

it('can generate valid url for next day', () => {
  jest.setSystemTime(dayjs.utc('2021-11-23', 'YYYY-MM-DD').startOf('d').valueOf())
  expect(url({ channel, date })).toBe(
    'https://programtv.onet.pl/program-tv/13th-street-250?dzien=1'
  )
})

it('can parse response', async () => {
  const content = fs.readFileSync(path.resolve(__dirname, '__data__/content.html'))
  const result = (await parser({ content, date })).map(p => {
    p.start = p.start.toJSON()
    p.stop = p.stop.toJSON()
    return p
  })

  expect(result).toMatchObject([
    {
      start: '2021-11-24T02:20:00.000Z',
      stop: '2021-11-24T22:30:00.000Z',
      title: 'Law & Order, odc. 15: Letzte Worte',
      category: 'Krimiserie',
      description:
        'Bei einer Reality-TV-Show stirbt einer der Teilnehmer. Zunächst tappen Briscoe (Jerry Orbach) und Green (Jesse L....',
      image: 'https://ocdn.eu/ptv-imported-images/akpa4046117.jpg'
    },
    {
      start: '2021-11-24T22:30:00.000Z',
      stop: '2021-11-25T00:00:00.000Z',
      title: 'Navy CIS, odc. 1: New Orleans',
      category: 'Krimiserie',
      description:
        'Der Abgeordnete Dan McLane, ein ehemaliger Vorgesetzter von Gibbs, wird in New Orleans ermordet. In den 90er Jahren...'
    },
    {
      start: '2021-11-25T00:00:00.000Z',
      stop: '2021-11-25T01:00:00.000Z',
      title: 'Navy CIS: L.A, odc. 13: High Society',
      category: 'Krimiserie',
      description:
        'Die Zahl der Drogentoten ist gestiegen. Das Team des NCIS glaubt, dass sich Terroristen durch den zunehmenden...'
    }
  ])
})

it('can handle empty guide', async () => {
  const result = await parser({
    date,
    channel,
    content: fs.readFileSync(path.resolve(__dirname, '__data__/no_content.html'))
  })
  expect(result).toMatchObject([])
})
