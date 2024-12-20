const { parser, url } = require('./snrt.ma.config.js')
const cheerio = require('cheerio')
const { DateTime } = require('luxon')
const dayjs = require('dayjs')
const utc = require('dayjs/plugin/utc')
const timezone = require('dayjs/plugin/timezone')
const fs = require('fs')
const path = require('path')
dayjs.extend(utc)
dayjs.extend(timezone)

const date = dayjs.utc('2024-12-19', 'YYYY-MM-DD').startOf('d')
const channel = { site_id: '1208', xmltv_id: 'AlAoula.ma', lang: 'ar' }

it('can generate valid url', () => {
  expect(url({ channel })).toBe('https://www.snrt.ma/ar/node/1208')
})

it('can parse response', () => {
  const content = fs.readFileSync(path.resolve(__dirname, '_data_/content.html'))
  const results = parser({ date, content }).map(p => {
    p.start = p.start.toJSON()
    p.stop = p.stop.toJSON()
    return p
  })

  expect(results).toMatchObject({
    start: '2024-12-19T07:00:00.000Z',
    stop: '2024-12-19T07:10:00.000Z',
    title: 'ﺍﻟﺴﻼﻡ ﺍﻟﻮﻃﻨﻲ + ﺍﻟﻘﺮﺁﻥ ﺍﻟﻜﺮﻳﻢ',
    category: 'القرآن الكريم'
  })
})


it('can handle empty guide', () => {
  const result = parser({
    date,
    channel: channel,
    content: '<!DOCTYPE html><html lang="ar" dir="rtl"><head></head><body></body></html>'
  })
  expect(result).toMatchObject([])
})
