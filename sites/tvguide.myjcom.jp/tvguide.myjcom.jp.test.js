// node ./scripts/channels.js --config=./sites/tvguide.myjcom.jp/tvguide.myjcom.jp.config.js --output=./sites/tvguide.myjcom.jp/tvguide.myjcom.jp.channels.xml
// npx epg-grabber --config=sites/tvguide.myjcom.jp/tvguide.myjcom.jp.config.js --channels=sites/tvguide.myjcom.jp/tvguide.myjcom.jp.channels.xml --output=guide.xml

const { parser, url } = require('./tvguide.myjcom.jp.config.js')
const dayjs = require('dayjs')
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
const content = `{"120_200_4_20220114":[{"@search.score":1,"cid":"120_7305523","serviceCode":"200_4","channelName":"スターチャンネル1","digitalNo":195,"eventId":"181","title":"[5.1]フードロア：タマリンド","commentary":"ＨＢＯ（Ｒ）アジア製作。日本の齊藤工などアジアの監督が、各国の食をテーマに描いたアンソロジーシリーズ。（全８話）（１９年　シンガポール　５６分）","attr":["5.1","hd","cp1"],"sortGenre":"31","hasImage":1,"imgPath":"\/monomedia\/si\/2022\/20220114\/7305523\/image\/7743d17b655b8d2274ca58b74f2f095c.jpg","isRecommended":null,"programStart":20220114050000,"programEnd":20220114060000,"programDate":20220114,"programId":568519,"start_time":"00","duration":60,"top":300,"end_time":"20220114060000","channel_type":"120","is_end":false,"show_remoterec":true}]}`

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
      description: `ＨＢＯ（Ｒ）アジア製作。日本の齊藤工などアジアの監督が、各国の食をテーマに描いたアンソロジーシリーズ。（全８話）（１９年　シンガポール　５６分）`,
      icon: 'https://tvguide.myjcom.jp/monomedia/si/2022/20220114/7305523/image/7743d17b655b8d2274ca58b74f2f095c.jpg',
      category: 'ドラマ'
    }
  ])
})

it('can handle empty guide', () => {
  const result = parser({
    date,
    channel,
    content: `{"120_200_3_20220114":[]}`
  })
  expect(result).toMatchObject([])
})
