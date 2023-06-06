// npx epg-grabber --config=sites/bein.com/bein.com.config.js --channels=sites/bein.com/bein.com.channels.xml --output=guide.xml

const fs = require('fs')
const path = require('path')
const { parser, url } = require('./bein.com.config.js')
const dayjs = require('dayjs')
const utc = require('dayjs/plugin/utc')
const customParseFormat = require('dayjs/plugin/customParseFormat')
dayjs.extend(customParseFormat)
dayjs.extend(utc)

const date = dayjs.utc('2023-01-19', 'YYYY-MM-DD').startOf('d')
const channel = { site_id: 'entertainment#1', xmltv_id: 'beINMovies1Premiere.qa', lang: 'en' }

it('can generate valid url', () => {
  const result = url({ date, channel })
  expect(result).toBe(
    'https://www.bein.com/en/epg-ajax-template/?action=epg_fetch&category=entertainment&cdate=2023-01-19&language=EN&loadindex=0&mins=00&offset=0&postid=25356&serviceidentity=bein.net'
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
    start: '2023-01-18T20:15:00.000Z',
    stop: '2023-01-18T22:15:00.000Z',
    title: 'The Walk',
    category: 'Movies'
  })

  expect(results[1]).toMatchObject({
    start: '2023-01-18T22:15:00.000Z',
    stop: '2023-01-19T00:00:00.000Z',
    title: 'Resident Evil: Welcome To Raccoon City',
    category: 'Movies'
  })

  expect(results[10]).toMatchObject({
    start: '2023-01-19T15:30:00.000Z',
    stop: '2023-01-19T18:00:00.000Z',
    title: 'Spider-Man: No Way Home',
    category: 'Movies'
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
