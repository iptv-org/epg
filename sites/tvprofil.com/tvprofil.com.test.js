const { parser, url, request } = require('./tvprofil.com.config.js')
const axios = require('axios')
const fs = require('fs')
const path = require('path')
const dayjs = require('dayjs')
const utc = require('dayjs/plugin/utc')
const customParseFormat = require('dayjs/plugin/customParseFormat')
dayjs.extend(customParseFormat)
dayjs.extend(utc)

jest.mock('axios')

// The program request is signed with a per-page-load nonce ("bi") read from the country's
// program page, sent alongside a session cookie. Mock that page so url()/headers() are
// deterministic and offline.
axios.get.mockImplementation(requestUrl => {
  if (requestUrl === 'https://tvprofil.com/bg/tv-programa/') {
    return Promise.resolve({
      status: 200,
      headers: { 'set-cookie': ['PHPSESSID=testsession; path=/; HttpOnly'] },
      data: 'Tvprofil.tvschedule = {"channels":{"url":"/x","timestamp":0},"bi":199604}'
    })
  }

  return Promise.resolve({ status: 200, headers: {}, data: '' })
})

const date = dayjs.utc('2025-07-29', 'YYYY-MM-DD').startOf('d')
const channel = {
  site_id: 'bg/tv-programa#24kitchen-bg',
  xmltv_id: '24KitchenBulgaria.bg',
  lang: 'bg'
}

it('can generate valid url', async () => {
  expect(await url({ channel, date })).toBe(
    'https://tvprofil.com/bg/tv-programa/program/?datum=2025-07-29&kanal=24kitchen-bg&callback=sportbg51328010&b48=51328010'
  )
})

it('can generate valid request headers', async () => {
  expect(await request.headers({ channel, date })).toMatchObject({
    'x-requested-with': 'XMLHttpRequest',
    'referer': 'https://tvprofil.com/tvprogram/',
    'cookie': 'PHPSESSID=testsession'
  })
})

it('can parse response', () => {
  const content = fs.readFileSync(path.resolve(__dirname, '__data__/content.txt'), 'utf8')
  const results = parser({ content }).map(p => {
    p.start = p.start.toJSON()
    p.stop = p.stop.toJSON()
    return p
  })

  expect(results[0]).toMatchObject({
    title: 'Save with Jamie 1, ep. 2',
    start: '2025-07-29T05:00:00.000Z',
    stop: '2025-07-29T06:00:00.000Z'
  })
})

it('can handle empty guide', () => {
  const content = fs.readFileSync(path.resolve(__dirname, '__data__/no_content.txt'), 'utf8')

  expect(parser({ content })).toMatchObject([])
})
