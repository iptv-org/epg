// npx epg-grabber --config=sites/astro.com.my/astro.com.my.config.js --channels=sites/astro.com.my/astro.com.my.channels.xml --output=guide.xml --timeout=30000 --days=2

const { parser, url } = require('./astro.com.my.config.js')
const fs = require('fs')
const path = require('path')
const axios = require('axios')
const dayjs = require('dayjs')
const utc = require('dayjs/plugin/utc')
const customParseFormat = require('dayjs/plugin/customParseFormat')
dayjs.extend(customParseFormat)
dayjs.extend(utc)

jest.mock('axios')

const date = dayjs.utc('2022-10-31', 'YYYY-MM-DD').startOf('d')
const channel = {
  site_id: '425',
  xmltv_id: 'TVBClassic.hk'
}

it('can generate valid url', () => {
  expect(url({ channel })).toBe('https://contenthub-api.eco.astro.com.my/channel/425.json')
})

it('can parse response', async () => {
  const content = fs.readFileSync(path.resolve(__dirname, '__data__/content.json'))

  axios.get.mockImplementation(url => {
    if (
      url ===
      'https://contenthub-api.eco.astro.com.my/api/v1/linear-detail?siTrafficKey=1:10000526:47979653'
    ) {
      return Promise.resolve({
        data: JSON.parse(fs.readFileSync(path.resolve(__dirname, '__data__/program.json')))
      })
    } else {
      return Promise.resolve({ data: '' })
    }
  })

  let results = await parser({ content, channel, date })
  results = results.map(p => {
    p.start = p.start.toJSON()
    p.stop = p.stop.toJSON()
    return p
  })

  expect(results.length).toBe(31)
  expect(results[0]).toMatchObject({
    start: '2022-10-30T16:10:00.000Z',
    stop: '2022-10-30T17:02:00.000Z',
    title: 'Triumph in the Skies S1 Ep06',
    description:
      'This classic drama depicts the many aspects of two complicated relationships set against an airline company. Will those involved ever find true love?',
    actors: ['Francis Ng Chun Yu', 'Joe Ma Tak Chung', 'Flora Chan Wai San'],
    directors: ['Joe Ma Tak Chung'],
    icon: 'https://s3-ap-southeast-1.amazonaws.com/ams-astro/production/images/1035X328883.jpg',
    rating: {
      system: 'LPF',
      value: 'U'
    },
    episode: 6,
    season: 1,
    categories: ['Drama']
  })
})

it('can handle empty guide', async () => {
  const content = fs.readFileSync(path.resolve(__dirname, '__data__/no_content.html'))
  const results = await parser({ date, content })

  expect(results).toMatchObject([])
})
