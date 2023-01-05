// npx epg-grabber --config=sites/dsmart.com.tr/dsmart.com.tr.config.js --channels=sites/dsmart.com.tr/dsmart.com.tr.channels.xml --output=guide.xml --timeout=30000 --days=2

const { parser, url } = require('./dsmart.com.tr.config.js')
const dayjs = require('dayjs')
const utc = require('dayjs/plugin/utc')
const customParseFormat = require('dayjs/plugin/customParseFormat')
dayjs.extend(customParseFormat)
dayjs.extend(utc)

const date = dayjs.utc('2021-11-06', 'YYYY-MM-DD').startOf('d')
const channel = {
  site_id: '58d29bb0eefad3db9c606290',
  xmltv_id: 'MovieSmartPremium.tr'
}
const content = `{"meta": {"code": 200, "message": "OK"}, "data": {"total": 200, "channels": [{"rating": 3, "ch_id": 805, "logo": "59f97253cfef0b75f4723ded", "ch_no": 1, "is_hd": true, "genre": [1, 2], "packages": ["58cfc9c7e138237a591f9a61", "58cfc9c7e138237a591f9a62", "58cfc9c7e138237a591f9a5f", "58cfc9c7e138237a591f9a60"], "slug": "moviesmart-premium", "hd": true, "_id": "58d29bb0eefad3db9c606290", "order": 1, "channel_name": "MovieSmart Premium", "description": "", "schedule": [{"actor": "", "year": "2015", "id": "60488f69cfef0b15935d70d7", "subject": "Goosebumps: Canavarlar Firarda (Goosebumps) T\\u00fcr: Komedi - Macera Y\\u00f6netmen: Rob Letterman Oyuncular: Jack Black, Dylan Minnette, Odeya Rush", "audio_subtitles": 3, "start_date": "2021-11-03T21:15:00Z", "channel": "58d29bb0eefad3db9c606290", "description": "B\\u00fcy\\u00fck \\u015fehirden k\\u00fc\\u00e7\\u00fck bir kasabaya ta\\u015f\\u0131nd\\u0131\\u011f\\u0131 i\\u00e7in mutsuz olan Zach Cooper, ta\\u015f\\u0131nd\\u0131klar\\u0131 evin tam yan\\u0131ndaki evde ya\\u015fayan g\\u00fczel k\\u0131z Hannah ile kar\\u015f\\u0131la\\u015f\\u0131p, Champ ile de k\\u0131sa s\\u00fcrede arkada\\u015f olunca yeni bir hayat i\\u00e7in umutlan\\u0131r. Ancak Zach, Hannah'n\\u0131n gizemli babas\\u0131n\\u0131n Goosebumps kitaplar\\u0131n\\u0131n yazar\\u0131, R.L. Stine oldu\\u011funu \\u00f6\\u011frendi\\u011finde, olaylar\\u0131n normal gitmeyece\\u011fini anlar. (Dil:T\\u00fcrk\\u00e7e/Orijinal - Altyaz\\u0131:T\\u00fcrk\\u00e7e/\\u0130ngilizce)", "director": "", "end_date": "2021-11-03T23:55:00Z", "genre": "sinema/genel", "program_name": "Goosebumps: Canavarlar Firarda", "day": "2021-11-05T21:00:00Z", "episode": "", "screen_violence": 4, "_id": "6185a3f6cfef0b1593e44e63", "duration": "1:40:00"},{"actor": "", "year": "2015", "id": "60488f69cfef0b15935d70d7", "subject": "Goosebumps: Canavarlar Firarda (Goosebumps) T\\u00fcr: Komedi - Macera Y\\u00f6netmen: Rob Letterman Oyuncular: Jack Black, Dylan Minnette, Odeya Rush", "audio_subtitles": 3, "start_date": "2021-11-03T23:55:00Z", "channel": "58d29bb0eefad3db9c606290", "description": "B\\u00fcy\\u00fck \\u015fehirden k\\u00fc\\u00e7\\u00fck bir kasabaya ta\\u015f\\u0131nd\\u0131\\u011f\\u0131 i\\u00e7in mutsuz olan Zach Cooper, ta\\u015f\\u0131nd\\u0131klar\\u0131 evin tam yan\\u0131ndaki evde ya\\u015fayan g\\u00fczel k\\u0131z Hannah ile kar\\u015f\\u0131la\\u015f\\u0131p, Champ ile de k\\u0131sa s\\u00fcrede arkada\\u015f olunca yeni bir hayat i\\u00e7in umutlan\\u0131r. Ancak Zach, Hannah'n\\u0131n gizemli babas\\u0131n\\u0131n Goosebumps kitaplar\\u0131n\\u0131n yazar\\u0131, R.L. Stine oldu\\u011funu \\u00f6\\u011frendi\\u011finde, olaylar\\u0131n normal gitmeyece\\u011fini anlar. (Dil:T\\u00fcrk\\u00e7e/Orijinal - Altyaz\\u0131:T\\u00fcrk\\u00e7e/\\u0130ngilizce)", "director": "", "end_date": "2021-11-03T01:55:00Z", "genre": "sinema/genel", "program_name": "Goosebumps: Canavarlar Firarda", "day": "2021-11-05T21:00:00Z", "episode": "", "screen_violence": 4, "_id": "6185a3f6cfef0b1593e44e63", "duration": "1:40:00"}]}]}}`

it('can generate valid url', () => {
  expect(url({ date, channel })).toBe(
    'https://www.dsmart.com.tr/api/v1/public/epg/schedules?page=1&limit=500&day=2021-11-06'
  )
})

it('can parse response', () => {
  const result = parser({ date, channel, content })
  expect(result).toMatchObject([
    {
      start: '2021-11-05T21:15:00.000Z',
      stop: '2021-11-05T23:55:00.000Z',
      title: 'Goosebumps: Canavarlar Firarda',
      category: 'sinema/genel',
      description: `Büyük şehirden küçük bir kasabaya taşındığı için mutsuz olan Zach Cooper, taşındıkları evin tam yanındaki evde yaşayan güzel kız Hannah ile karşılaşıp, Champ ile de kısa sürede arkadaş olunca yeni bir hayat için umutlanır. Ancak Zach, Hannah'nın gizemli babasının Goosebumps kitaplarının yazarı, R.L. Stine olduğunu öğrendiğinde, olayların normal gitmeyeceğini anlar. (Dil:Türkçe/Orijinal - Altyazı:Türkçe/İngilizce)`
    },
    {
      start: '2021-11-05T23:55:00.000Z',
      stop: '2021-11-06T01:55:00.000Z',
      title: 'Goosebumps: Canavarlar Firarda',
      category: 'sinema/genel',
      description: `Büyük şehirden küçük bir kasabaya taşındığı için mutsuz olan Zach Cooper, taşındıkları evin tam yanındaki evde yaşayan güzel kız Hannah ile karşılaşıp, Champ ile de kısa sürede arkadaş olunca yeni bir hayat için umutlanır. Ancak Zach, Hannah'nın gizemli babasının Goosebumps kitaplarının yazarı, R.L. Stine olduğunu öğrendiğinde, olayların normal gitmeyeceğini anlar. (Dil:Türkçe/Orijinal - Altyazı:Türkçe/İngilizce)`
    }
  ])
})

it('can handle empty guide', () => {
  const result = parser({
    date,
    channel,
    content: `{"meta": {"code": 200, "message": "OK"}, "data": {"total": 200, "channels": []}}`
  })
  expect(result).toMatchObject([])
})
