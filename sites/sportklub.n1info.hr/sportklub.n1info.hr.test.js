const { parser, url } = require('./sportklub.n1info.hr.config.js')
const fs = require('fs')
const path = require('path')
const dayjs = require('dayjs')
const utc = require('dayjs/plugin/utc')
const customParseFormat = require('dayjs/plugin/customParseFormat')
dayjs.extend(customParseFormat)
dayjs.extend(utc)

const date = dayjs.utc('2026-06-22', 'YYYY-MM-DD').startOf('d')
const channel = {
  site_id: '556',
  xmltv_id: 'SportKlub1'
}

it('can generate valid url', () => {
  const u = url({ channel, date })
  expect(u).toContain('/v1/public/events/epg')
  expect(u).toContain('cid=556')
  expect(u).toContain('communityIdentifier=sk_hr')
  expect(u).toContain('languageId=181')
})

it('can parse response', () => {
  // Event 1 falls inside the Europe/Zagreb day window for 2026-06-22; event 2 (the day before)
  // is outside it and must be dropped. start/stop are kept as epoch ms.
  const content = fs.readFileSync(path.resolve(__dirname, '__data__/content.html'), 'utf8')
  const result = parser({ content, channel, date })
  expect(result).toMatchObject([
    {
      title: 'Liga prvaka',
      description: 'PSG - Liverpool',
      start: 1782122400000,
      stop: 1782127800000,
      image: 'https://images-web.ug-be.cdn.united.cloud/x/y.jpg'
    }
  ])
  expect(result.length).toBe(1)
})

it('can handle empty guide', () => {
  const result = parser({
    date,
    channel,
    content: fs.readFileSync(path.resolve(__dirname, '__data__/no_content.html'), 'utf8')
  })
  expect(result).toMatchObject([])
})
