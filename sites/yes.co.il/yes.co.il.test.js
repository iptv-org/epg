const { parser, url, request } = require('./yes.co.il.config.js')
const fs = require('fs')
const path = require('path')
const dayjs = require('dayjs')
const utc = require('dayjs/plugin/utc')
const customParseFormat = require('dayjs/plugin/customParseFormat')
dayjs.extend(customParseFormat)
dayjs.extend(utc)

const date = dayjs.utc('2025-01-30', 'YYYY-MM-DD').startOf('d')
const channel = { site_id: 'YSA1' }

it('can generate valid url', () => {
  expect(url({ channel, date })).toBe(
    'https://svc.yes.co.il/api/content/broadcast-schedule/channels/YSA1?date=2025-1-30&ignorePastItems=true'
  )
})

it('can generate valid request headers', () => {
  expect(request.headers).toMatchObject({
    'user-agent':
      'Mozilla/5.0 (Linux; Linux x86_64) AppleWebKit/600.3 (KHTML, like Gecko) Chrome/48.0.2544.291 Safari/600'
  })
})

it('can parse response', () => {
  const content = fs.readFileSync(path.resolve(__dirname, '__data__/content.json'))

  let results = parser({ content })

  expect(results.length).toBe(13)
  expect(results[0]).toMatchObject({
    title: 'הבית',
    description:
      "דרמת מתח סוחפת. זוג צעיר שוכר וילה בכפר רומנטי באיטליה כדי לשפר את הזוגיות שלהם, אך עד מהרה מוצאים עצמם קורבנות בתוכנית זדונית של בעל המקום. עם: ארון פול ('שובר שורות'), אמילי רטאייקאוסקי. במאי: ג'ורג' רטליף. 2018.",
    image: 'https://fykswkmjb.filerobot.com/VodAndHomeChan/VP001212610.JPG',
    start: '2025-01-29T23:52:00Z',
    stop: '2025-01-30T01:31:00Z'
  })
})

it('can handle empty guide', () => {
  const results = parser({
    content: '{"items":[]}'
  })

  expect(results).toMatchObject([])
})
