// npm run channels:parse -- --config=./sites/beinsports.com/beinsports.com.config.js --output=./sites/beinsports.com/beinsports.com_qa-ar.channels.xml --set=lang:ar --set=region:ar
// npx epg-grabber --config=sites/beinsports.com/beinsports.com.config.js --channels=sites/beinsports.com/beinsports.com_qa-en.channels.xml --output=guide.xml --timeout=30000 --days=2
// npx epg-grabber --config=sites/beinsports.com/beinsports.com.config.js --channels=sites/beinsports.com/beinsports.com_us-en.channels.xml --output=guide.xml --timeout=30000 --days=2

const { parser, url } = require('./beinsports.com.config.js')
const fs = require('fs')
const path = require('path')
const dayjs = require('dayjs')
const utc = require('dayjs/plugin/utc')
const customParseFormat = require('dayjs/plugin/customParseFormat')
dayjs.extend(customParseFormat)
dayjs.extend(utc)

const date = dayjs.utc('2022-05-08', 'YYYY-MM-DD').startOf('d')
const channel = { site_id: '#2', xmltv_id: 'BeINSports.qa' }

it('can generate valid url', () => {
  const result = url({ date, channel })
  expect(result).toBe(
    'https://epg.beinsports.com/utctime.php?mins=00&serviceidentity=beinsports.com&cdate=2022-05-08'
  )
})

it('can generate valid url for arabic guide', () => {
  const channel = { site_id: 'ar#1', xmltv_id: 'BeINSports.qa' }
  const result = url({ date, channel })
  expect(result).toBe(
    'https://epg.beinsports.com/utctime_ar.php?mins=00&serviceidentity=beinsports.com&cdate=2022-05-08'
  )
})

it('can parse response', () => {
  const content = fs.readFileSync(path.resolve('sites/beinsports.com/__data__/content.html'))
  const results = parser({ date, channel, content }).map(p => {
    p.start = p.start.toJSON()
    p.stop = p.stop.toJSON()
    return p
  })

  expect(results[0]).toMatchObject({
    start: '2022-05-07T19:30:00.000Z',
    stop: '2022-05-07T21:20:00.000Z',
    title: 'Lorient vs Marseille',
    category: ['Ligue 1 2021/22']
  })
})

it('can parse response for tomorrow', () => {
  const date = dayjs.utc('2022-05-09', 'YYYY-MM-DD').startOf('d')
  const content = fs.readFileSync(
    path.resolve('sites/beinsports.com/__data__/content_tomorrow.html')
  )
  const results = parser({ date, channel, content }).map(p => {
    p.start = p.start.toJSON()
    p.stop = p.stop.toJSON()
    return p
  })

  expect(results[0]).toMatchObject({
    start: '2022-05-08T21:20:00.000Z',
    stop: '2022-05-08T23:10:00.000Z',
    title: 'Celtic vs Hearts',
    category: ['SPFL Premiership 2021/22']
  })
})

it('can parse US response', () => {
  const content = fs.readFileSync(path.resolve('sites/beinsports.com/__data__/content_us.html'))
  const results = parser({ date, channel, content }).map(p => {
    p.start = p.start.toJSON()
    p.stop = p.stop.toJSON()
    return p
  })

  expect(results[0]).toMatchObject({
    start: '2022-05-07T20:00:00.000Z',
    stop: '2022-05-07T22:00:00.000Z',
    title: 'Basaksehir vs. Galatasaray',
    category: ['Fútbol Turco Superliga', 'Soccer']
  })
})

it('can handle empty guide', () => {
  const noContent = fs.readFileSync(path.resolve('sites/beinsports.com/__data__/no-content.html'))
  const result = parser({
    date,
    channel,
    content: noContent
  })
  expect(result).toMatchObject([])
})
