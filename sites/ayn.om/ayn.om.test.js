const { parser, url } = require('./ayn.om.config.js')
const fs = require('fs')
const path = require('path')
const dayjs = require('dayjs')
const utc = require('dayjs/plugin/utc')
const customParseFormat = require('dayjs/plugin/customParseFormat')
dayjs.extend(customParseFormat)
dayjs.extend(utc)

const channel = {
  site_id: '159/قناة-عمان-الرياضية'
}

it('can generate valid url', () => {
  expect(url({ channel })).toBe('https://ayn.om/schedule/159/قناة-عمان-الرياضية')
})

it('can parse response for today', () => {
  jest.useFakeTimers().setSystemTime(new Date('2026-04-08').getTime())
  const date = dayjs.utc('2026-04-08', 'YYYY-MM-DD').startOf('d')
  const content = fs.readFileSync(path.resolve(__dirname, '__data__/content.html'))

  const results = parser({ content, date }).map(p => {
    p.start = p.start.toJSON()
    p.stop = p.stop.toJSON()

    return p
  })

  expect(results.length).toBe(22)
  expect(results[0]).toMatchObject({
    title: 'لا يوجد جدول',
    start: '2026-04-07T20:00:00.000Z',
    stop: '2026-04-07T21:00:00.000Z'
  })

  jest.useRealTimers()
})

it('can parse response for friday', () => {
  const date = dayjs.utc('2026-04-10', 'YYYY-MM-DD').startOf('d')
  const content = fs.readFileSync(path.resolve(__dirname, '__data__/content.html'))

  const results = parser({ content, date }).map(p => {
    p.start = p.start.toJSON()
    p.stop = p.stop.toJSON()

    return p
  })

  expect(results.length).toBe(24)
  expect(results[0]).toMatchObject({
    title: 'دوري جندال لكرة القدم 2025-2026 - الحلقة 73',
    start: '2026-04-09T20:00:00.000Z',
    stop: '2026-04-09T21:00:00.000Z'
  })
  expect(results[23]).toMatchObject({
    title: 'الدكـة - S1- 2026 - الحلقة 23',
    start: '2026-04-10T19:00:00.000Z',
    stop: '2026-04-10T20:00:00.000Z'
  })
})

it('can handle empty guide', () => {
  const date = dayjs.utc('2026-04-10', 'YYYY-MM-DD').startOf('d')
  const content = fs.readFileSync(path.resolve(__dirname, '__data__/no_content.html'))
  const results = parser({ content, date })

  expect(results).toMatchObject([])
})
