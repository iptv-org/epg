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

const date = dayjs.utc('2026-04-29').startOf('d')
const channel = {
  site_id: 'axn',
  xmltv_id: 'AXN.id',
  lang: 'id'
}

axios.get.mockImplementation(url => {
  const urls = {
    'https://tivie.id/program/the-hunting-party-e3-nwzDnwrCmAnB?utm_source=tivie&utm_medium=referral&utm_campaign=channel_detail&utm_content=button': 'program01.html',
    'https://tivie.id/program/the-rookie-s7-e6-nwzDnwv6mwzC?utm_source=tivie&utm_medium=referral&utm_campaign=channel_detail&utm_content=button': 'program02.html'
  }
  let data = ''
  if (urls[url] !== undefined) {
    data = fs.readFileSync(path.join(__dirname, '__data__', urls[url])).toString()
  }
  return Promise.resolve({ data })
})

it('can generate valid url', () => {
  expect(url({ channel, date })).toBe('https://tivie.id/channel/axn/20260429')
})

it('can parse response', async () => {
  const content = fs.readFileSync(path.join(__dirname, '__data__', 'content.html'))
  const results = (await parser({ date, content, channel })).map(p => {
    p.start = p.start.toJSON()
    p.stop = p.stop.toJSON()
    return p
  })

  expect(results.length).toBe(28)
  expect(results[0]).toMatchObject({
    start: '2026-04-28T17:00:00.000Z',
    stop: '2026-04-28T17:25:00.000Z',
    title: 'The Hunting Party S1, Ep. 3',
    description:
      'Di pedalaman Montana, tim memburu seorang pembunuh berantai nan kejam bernama Lowe yang terobsesi dengan kawanan serigala.',
    image:
      'https://i0.wp.com/is3.cloudhost.id/tivie/poster/2025/10/68e9d54962c8f-1760154953.jpg?resize=480,270',
    categories: ['Serial'],
    season: 1,
    episode: 3
  })
  expect(results[2]).toMatchObject({
    start: '2026-04-28T18:20:00.000Z',
    stop: '2026-04-28T19:15:00.000Z',
    title: 'The Rookie S7, Ep. 6',
    description:
      'Grey memberi Tim dan Lucy suatu tugas yang tak menyenangkan, sementara John dan Celina melacak keberadaan seorang gadis yang menghilang. Beberapa hubungan asmara berakhir di suatu acara amal.',
    image:
      'https://i0.wp.com/is3.cloudhost.id/tivie/poster/2025/01/677a9f2fb4b5f-1736089391.jpg?resize=480,270',
    categories: ['Serial'],
    season: 7,
    episode: 6
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
