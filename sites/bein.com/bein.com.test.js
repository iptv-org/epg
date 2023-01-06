// npx epg-grabber --config=sites/bein.com/bein.com.config.js --channels=sites/bein.com/bein.com.channels.xml --output=guide.xml --timeout=30000 --days=2

const fs = require('fs')
const path = require('path')
const { parser, url } = require('./bein.com.config.js')
const dayjs = require('dayjs')
const utc = require('dayjs/plugin/utc')
const customParseFormat = require('dayjs/plugin/customParseFormat')
dayjs.extend(customParseFormat)
dayjs.extend(utc)

const date = dayjs.utc('2022-05-08', 'YYYY-MM-DD').startOf('d')
const channel = { site_id: '0#1', xmltv_id: 'BeInSports.qa' }

it('can generate valid url', () => {
  const result = url({ date, channel })
  expect(result).toBe(
    'https://www.bein.com/en/epg-ajax-template/?action=epg_fetch&category=sports&cdate=2022-05-08&language=EN&loadindex=0&mins=00&offset=0&postid=25356&serviceidentity=bein.net'
  )
})

it('can parse response', () => {
  const content = fs.readFileSync(path.resolve('sites/bein.com/__data__/content.html'))
  const results = parser({ date, channel, content }).map(p => {
    p.start = p.start.toJSON()
    p.stop = p.stop.toJSON()
    return p
  })

  expect(results[0]).toMatchObject({
    start: '2022-05-07T20:30:00.000Z',
    stop: '2022-05-07T21:00:00.000Z',
    title: 'WITHOUT RESTRICTIONS - Live Studio NEWS',
    category: 'Sports News'
  })

  expect(results[1]).toMatchObject({
    start: '2022-05-07T21:00:00.000Z',
    stop: '2022-05-07T21:45:00.000Z',
    title: 'THE ISSUE OF THE WEEK - NEWS',
    category: 'Sports News'
  })

  expect(results[54]).toMatchObject({
    start: '2022-05-08T20:30:00.000Z',
    stop: '2022-05-08T21:00:00.000Z',
    title: 'ARAB NEWS - Live Studio NEWS',
    category: 'Sports News'
  })
})

it('can handle empty guide', () => {
  const noContent = fs.readFileSync(path.resolve('sites/bein.com/__data__/no-content.html'))
  const result = parser({
    date,
    channel,
    content: noContent
  })
  expect(result).toMatchObject([])
})
