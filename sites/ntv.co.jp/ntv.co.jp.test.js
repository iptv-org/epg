const { parser, url } = require('./ntv.co.jp.config.js')
const dayjs = require('dayjs')
const path = require('path')
const fs = require('fs')
const utc = require('dayjs/plugin/utc')
const customParseFormat = require('dayjs/plugin/customParseFormat')
dayjs.extend(customParseFormat)
dayjs.extend(utc)

const date = dayjs.utc('2026-08-03', 'YYYY-MM-DD').startOf('d')

it('can generate valid url', () => {
  expect(url).toBe('https://www.ntv.co.jp/program/json/program_list.json')
})

it('can parse response', () => {
  const buffer = fs.readFileSync(path.resolve(__dirname, '__data__/content.json'))

  const results = parser({ buffer, date }).map(p => {
    p.start = p.start.toJSON()
    p.stop = p.stop.toJSON()
    return p
  })

  expect(results.length).toBe(22)
  expect(results[0]).toMatchObject({
    title: 'NNNドキュメント’26「原爆ドーム~目から消えるものは、心からも消える~」[解][字]',
    description:
      '世界遺産の登録から30年を迎える「原爆ドーム」。「崩れるままに崩れてしまえばいい」。被爆者にとって、あの日の記憶を呼び起こす原爆の象徴は戦後20年あまり放置された。「目から消えるものは、心からも消える」。保存を求めて声を上げたのは、子どもたち。その歩みと重なる東北の震災遺構があった。広島のシンボルは、なぜそこに立ち続けるのか。被爆から81年。原爆ドームに思いを託す、人々を見つめる。',
    actors: ['吉川晃司'],
    start: '2026-08-02T15:55:00.000Z',
    stop: '2026-08-02T16:50:00.000Z'
  })
  expect(results[1]).toMatchObject({
    title: 'ライターズ!',
    description: 'ゲストは『踊る!さんま御殿!!』から平野ノラ!番組の魅力を「特殊」と語る背景とは',
    actors: ['ゲスト:平野ノラ\r\nライター:アーバン・タカト'],
    start: '2026-08-02T16:50:00.000Z',
    stop: '2026-08-02T17:10:00.000Z'
  })
})

it('can handle empty guide', () => {
  const results = parser({ content: '', date })

  expect(results).toMatchObject([])
})
