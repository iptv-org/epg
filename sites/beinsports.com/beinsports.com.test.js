// npx epg-grabber --config=sites/beinsports.com/beinsports.com.config.js --channels=sites/beinsports.com/beinsports.com_qa-en.channels.xml --output=guide.xml --timeout=30000 --days=2

const { parser, url } = require('./beinsports.com.config.js')
const fs = require('fs')
const path = require('path')
const dayjs = require('dayjs')
const utc = require('dayjs/plugin/utc')
const customParseFormat = require('dayjs/plugin/customParseFormat')
dayjs.extend(customParseFormat)
dayjs.extend(utc)

const date = dayjs.utc('2022-05-08', 'YYYY-MM-DD').startOf('d')
const channel = { site_id: '#1', xmltv_id: 'BeINSports.qa' }

it('can generate valid url', () => {
  const result = url({ date })
  expect(result).toBe(
    'https://epg.beinsports.com/utctime.php?mins=00&serviceidentity=beinsports.com&cdate=2022-05-08'
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
    start: '2022-05-07T19:45:00.000Z',
    stop: '2022-05-07T21:30:00.000Z',
    title: 'Al Arabi vs Al Khor - Qatar Stars League 2021/2022',
    category: 'Qatar Stars League'
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
