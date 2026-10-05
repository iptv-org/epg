const { parser, url, request } = require('./www.tv-tokyo.co.jp.config.js')
const fs = require('fs')
const path = require('path')
const dayjs = require('dayjs')
const utc = require('dayjs/plugin/utc')
const customParseFormat = require('dayjs/plugin/customParseFormat')
dayjs.extend(customParseFormat)
dayjs.extend(utc)

const date = dayjs.utc('2026-05-06', 'YYYY-MM-DD').startOf('d')
const channel = { site_id: 'bs-tv-tokyo-4k' }

it('can generate valid url', () => {
  expect(url({ channel, date })).toBe('https://www.tv-tokyo.co.jp/tbcms/assets/data/20260506.json')
})

it('can generate valid request headers', () => {
  expect(request.headers).toMatchObject({
    'User-Agent':
      'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Safari/537.36'
  })
})

it('can parse response', () => {
  const content = fs.readFileSync(path.resolve(__dirname, '__data__/content.json'))

  const results = parser({ content, channel }).map(p => {
    p.start = p.start.toJSON()
    p.stop = p.stop.toJSON()

    return p
  })

  expect(results.length).toBe(33)
  expect(results[0]).toMatchObject({
    title: '快適！ショッピングスタジオＤＸ',
    description:
      'ジャパネットたかたテレビショッピング。今だけの期間限定商品をお得に手にする大チャンス！さらに生放送だからできる旬な商品をご紹介します！',
    image:
      'https://www.tv-tokyo.co.jp/tbcms/assets/images/alt_bs-tv-tokyo-4k.png?width=320&height=180&color=ffffff',
    start: '2026-05-06T03:00:00.000Z',
    stop: '2026-05-06T04:56:00.000Z'
  })
  expect(results[32]).toMatchObject({
    title: '乗れない鉄道に乗ってみた！　一挙放送',
    description:
      '乗れない鉄道に「乗った気分」になって、普段見ることのない景色にゆったり浸れる情景ドキュメンタリー番組。',
    image:
      'https://www.tv-tokyo.co.jp/tbcms/assets/images/alt_bs-tv-tokyo-4k.png?width=320&height=180&color=ffffff',
    start: '2026-05-05T23:58:00.000Z',
    stop: '2026-05-06T03:00:00.000Z'
  })
})

it('can handle empty guide', () => {
  const results = parser({ content: '', channel })

  expect(results).toMatchObject([])
})
