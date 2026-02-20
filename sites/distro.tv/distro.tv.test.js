const fs = require('fs')
const path = require('path')
const { parser, url, channels } = require('./distro.tv.config.js')
const dayjs = require('dayjs')
const utc = require('dayjs/plugin/utc')
const customParseFormat = require('dayjs/plugin/customParseFormat')
dayjs.extend(customParseFormat)
dayjs.extend(utc)

const axios = require('axios')
jest.mock('axios')

const date = dayjs.utc('2026-02-10', 'YYYY-MM-DD').startOf('d')
const channel = {
  site_id: '45143'
}

it('can generate valid url', () => {
  expect(url({ channel, date })).toBe(
    'https://tv.jsrdn.com/epg/query.php?range=now,48h&id=45143,'
  )
})

it('can parse response', () => {
  const content = fs.readFileSync(path.resolve(__dirname, '__data__/content.json'), 'utf8')
  const results = parser({ content, channel })

  expect(results[0]).toMatchObject({
    title: 'News',
    description: 'The leading news stories of the moment.',
    start: dayjs.utc('2026-02-10 10:17:05'),
    stop: dayjs.utc('2026-02-10 10:30:00')
  })
  expect(results[1]).toMatchObject({
    title: 'Euronews Now',
    description: 'Breaking News. In depth analysis on the biggest stories making headlines in Europe and across the world.',
    start: dayjs.utc('2026-02-10 10:30:00'),
    stop: dayjs.utc('2026-02-10 10:46:00')
  })
})

it('can handle empty guide', () => {
  const results = parser({
    content: '{"epg":{"45143":{"title":"Euronews","slots":[]}}}',
    channel
  })
  expect(results).toMatchObject([])
})

it('can fetch channels', async () => {
  axios.get.mockResolvedValue({
    data: {
      shows: {
        414: {
          title: 'Titanic TV',
          language: 'en',
          img_logo: 'logo.png',
          seasons: [{ episodes: [{ id: 10953 }] }]
        }
      }
    }
  })

  const result = await channels()
  expect(result[0]).toMatchObject({
    lang: 'en',
    site_id: '10953',
    name: 'Titanic TV'
  })
})