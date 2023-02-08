// npm run channels:parse -- --config=./sites/tv.vera.com.uy/tv.vera.com.uy.config.js --output=./sites/tv.vera.com.uy/tv.vera.com.uy.channels.xml
// npx epg-grabber --config=sites/tv.vera.com.uy/tv.vera.com.uy.config.js --channels=sites/tv.vera.com.uy/tv.vera.com.uy.channels.xml --output=guide.xml --days=2

const { parser, url, request } = require('./tv.vera.com.uy.config.js')
const fs = require('fs')
const axios = require('axios')
const path = require('path')
const dayjs = require('dayjs')
const utc = require('dayjs/plugin/utc')
const customParseFormat = require('dayjs/plugin/customParseFormat')
dayjs.extend(customParseFormat)
dayjs.extend(utc)

jest.mock('axios')

axios.post.mockImplementation((url, data, opts) => {
  if (
    url === 'https://veratv-be.vera.com.uy/api/sesiones' &&
    JSON.stringify(opts.headers) ===
      JSON.stringify({
        'Content-Type': 'application/json'
      }) &&
    JSON.stringify(data) ===
      JSON.stringify({
        tipo: 'anonima'
      })
  ) {
    return Promise.resolve({
      data: JSON.parse(fs.readFileSync(path.resolve(__dirname, '__data__/session.json')))
    })
  } else {
    return Promise.resolve({
      data: JSON.parse(fs.readFileSync(path.resolve(__dirname, '__data__/no_session.json')))
    })
  }
})

const date = dayjs.utc('2023-02-11', 'YYYY-MM-DD').startOf('d')
const channel = {
  site_id: '2s6nd',
  xmltv_id: 'Canal5.uy'
}

it('can generate valid url', async () => {
  const result = await url({ date, channel })

  expect(result).toBe(
    `https://cds-frontend.vera.com.uy/api-contenidos/canales/epg/2s6nd?limit=500&dias_siguientes=0&fecha=2023-02-11&token=MpDY52p1V6g511VSABp1015B`
  )
})

it('can generate valid request headers', async () => {
  const result = await request.headers()

  expect(result).toMatchObject({
    authorization:
      'Bearer eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJpc3MiOnsidGlwbyI6ImFub25pbWEifSwic3ViIjoiTXBEWTUycDFWNmc1MTFWU0FCcDEwMTVCIiwicHJuIjp7ImlkX3NlcnZpY2lvIjozLCJpZF9mcm9udGVuZCI6MTE5NiwiaXAiOiIxNzkuMjcuMTU0LjI0MiIsImlwX3JlZmVyZW5jaWFkYSI6IjE4OC4yNDIuNDguOTMiLCJpZF9kaXNwb3NpdGl2byI6MH0sImF1ZCI6IkFwcHNcL1dlYnMgRnJvbnRlbmRzIiwiaWF0IjoxNjc1ODI3NDU2LCJleHAiOjE2NzU4NDkwNTZ9.8bAQciQl5DOIZF7GgCl6ad-KJUSpqQREetozGv_IH5s',
    'x-frontend-id': 1196,
    'x-service-id': 3,
    'x-system-id': 1
  })
})

it('can parse response', () => {
  const content = fs.readFileSync(path.resolve(__dirname, '__data__/content.json'), 'utf8')
  let results = parser({ content })
  results = results.map(p => {
    p.start = p.start.toJSON()
    p.stop = p.stop.toJSON()
    return p
  })

  expect(results[0]).toMatchObject({
    start: '2023-02-11T02:30:00.000Z',
    stop: '2023-02-11T04:00:00.000Z',
    title: 'Canal 5 Noticias rep.',
    sub_title: '',
    description: ''
  })
})

it('can handle empty guide', () => {
  const results = parser({
    content: fs.readFileSync(path.resolve(__dirname, '__data__/no_content.json'), 'utf8')
  })

  expect(results).toMatchObject([])
})
