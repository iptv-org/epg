const { parser, url } = require('./tvguide.myjcom.jp.config.js')
const dayjs = require('dayjs')
const fs = require('fs')
const path = require('path')
const utc = require('dayjs/plugin/utc')
const customParseFormat = require('dayjs/plugin/customParseFormat')
dayjs.extend(customParseFormat)
dayjs.extend(utc)

const date = dayjs.utc('2022-01-14', 'YYYY-MM-DD').startOf('d')
const channel = {
  site_id: '120_200_4',
  name: 'Star Channel 1',
  xmltv_id: 'StarChannel1.jp'
}
const content = fs.readFileSync(path.resolve(__dirname, './__data__/content.json'), 'utf8')

it('can generate valid url', () => {
  const result = url({ date, channel })
  expect(result).toBe('https://tvguide.myjcom.jp/api/getEpgInfo/?channels=120_200_4_20220114')
})

it('can parse response', () => {
  const result = parser({ date, channel, content }).map(p => {
    p.start = p.start.toJSON()
    p.stop = p.stop.toJSON()
    return p
  })

  expect(result).toMatchObject([
    {
      start: '2022-01-13T20:00:00.000Z',
      stop: '2022-01-13T21:00:00.000Z',
      title: '[5.1]フードロア：タマリンド',
      description:
        'ＨＢＯ（Ｒ）アジア製作。日本の齊藤工などアジアの監督が、各国の食をテーマに描いたアンソロジーシリーズ。（全８話）（１９年　シンガポール　５６分）',
      image:
        'https://tvguide.myjcom.jp/monomedia/si/2022/20220114/7305523/image/7743d17b655b8d2274ca58b74f2f095c.jpg',
      category: 'ドラマ'
    }
  ])
})

it('can handle empty guide', () => {
  const result = parser({
    date,
    channel,
    content: fs.readFileSync(path.resolve(__dirname, './__data__/no_content.json'), 'utf8')
  })
  expect(result).toMatchObject([])
})
