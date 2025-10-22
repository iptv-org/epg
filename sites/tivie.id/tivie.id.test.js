const { parser, url } = require('./tivie.id.config')
const fs = require('fs')
const path = require('path')
const axios = require('axios')
const dayjs = require('dayjs')
const utc = require('dayjs/plugin/utc')
const customParseFormat = require('dayjs/plugin/customParseFormat')

dayjs.extend(customParseFormat)
dayjs.extend(utc)

jest.mock('axios')

const date = dayjs.utc('2024-12-31').startOf('d')
const channel = {
  site_id: 'axn',
  xmltv_id: 'AXN.id',
  lang: 'id'
}

axios.get.mockImplementation(url => {
  const urls = {
    'https://tivie.id/film/white-house-down-nwzDnwz9nAv6': 'program01.html',
    'https://tivie.id/program/hudson-rex-s6-e14-nwzDnwvBmQr9': 'program02.html'
  }
  let data = ''
  if (urls[url] !== undefined) {
    data = fs.readFileSync(path.join(__dirname, '__data__', urls[url])).toString()
  }
  return Promise.resolve({ data })
})

it('can generate valid url', () => {
  expect(url({ channel, date })).toBe('https://tivie.id/channel/axn/20241231')
})

it('can parse response', async () => {
  const content = fs.readFileSync(path.join(__dirname, '__data__', 'content.html'))
  const results = (await parser({ date, content, channel })).map(p => {
    p.start = p.start.toJSON()
    p.stop = p.stop.toJSON()
    return p
  })

  expect(results.length).toBe(27)
  expect(results[0]).toMatchObject({
    start: '2024-12-30T17:00:00.000Z',
    stop: '2024-12-30T17:05:00.000Z',
    title: 'White House Down',
    description:
      'Saat melakukan tur di Gedung Putih bersama putrinya yang masih kecil, seorang perwira polisi beraksi untuk melindungi anaknya dan presiden dari sekelompok penjajah paramiliter bersenjata lengkap.',
    image:
      'https://i0.wp.com/is3.cloudhost.id/tivie/poster/2023/09/65116c78791c2-1695640694.jpg?resize=480,270'
  })
  expect(results[2]).toMatchObject({
    start: '2024-12-30T18:00:00.000Z',
    stop: '2024-12-30T18:55:00.000Z',
    title: 'Hudson & Rex S6, Ep. 14',
    description:
      'Saat guru musik Jesse terbunuh di studio rekamannya, Charlie dan Rex menghubungkan kejahatan tersebut dengan pembunuhan yang tampaknya tak ada hubungannya.',
    image:
      'https://i0.wp.com/is3.cloudhost.id/tivie/poster/2024/07/668b7ced47b25-1720417517.jpg?resize=480,270',
    season: 6,
    episode: 14
  })
})

it('can handle empty guide', async () => {
  const results = await parser({
    date,
    channel,
    content: ''
  })
  expect(results).toMatchObject([])
})
