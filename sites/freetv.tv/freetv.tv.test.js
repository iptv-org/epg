const { parser, url } = require('./freetv.tv.config.js')
const dayjs = require('dayjs')
const utc = require('dayjs/plugin/utc')
const customParseFormat = require('dayjs/plugin/customParseFormat')
dayjs.extend(customParseFormat)
dayjs.extend(utc)

const date = dayjs.utc('2025-03-28', 'YYYY-MM-DD').startOf('d')
const channel = {
  site_id: '3370462',
  xmltv_id: 'Kan11.il'
}

it('can generate valid url', () => {
  expect(url({ channel, date })).toBe('https://web.freetv.tv/api/products/lives/programmes?liveId[]=3370462&since=2025-03-28T00%3A00%2B0200&till=2025-03-29T00%3A00%2B0300&lang=HEB&platform=BROWSER')
})

it('can parse response', () => {
  const content = '[{"id":5856194,"publicUid":"f17b5a1d-3f2a-42a0-a11b-a08e5c9785fd","title":"בוש 4 - פרק 3","lead":"עונה 4 חדשה לדרמה הבלשית. 3. השטן בתוך הבית: הכוח המיוחד מנסה לחקור, ומגלה אליבי שקרי עם השלכות מרעישות. הבלש סנטיאגו רוברטסון צריך לשים את קשריו האישיים בצד למען החקירה. בוש זוכה לביקור פתע לילי.כ עב","description":"עונה 4 חדשה לדרמה הבלשית. 3. השטן בתוך הבית: הכוח המיוחד מנסה לחקור, ומגלה אליבי שקרי עם השלכות מרעישות. הבלש סנטיאגו רוברטסון צריך לשים את קשריו האישיים בצד למען החקירה. בוש זוכה לביקור פתע לילי.כ עב","rating":14,"ratingEmbedded":false,"type":"PROGRAMME","uhd":false,"since":"2025-03-27T21:26:00Z","till":"2025-03-27T22:17:00Z","images":{"16x9":[{"url":"//d1zqtf09wb8nt5.cloudfront.net/scale/oil/freetv/upload/programme/1361162/COVER/images/1361162_1736767668746.jpg?dsth=177&dstw=315&srcmode=0&srcx=0&srcy=0&quality=65&type=1&srcw=1/1&srch=1/1","templateUrl":"//d1zqtf09wb8nt5.cloudfront.net/scale/oil/freetv/upload/programme/1361162/COVER/images/1361162_1736767668746.jpg?srcmode=0&srcx=0&srcy=0&quality=65&type=1&srcw=1/1&srch=1/1&dsth={height:177}&dstw={width:315}"}]},"genres":[],"webUrl":"https://web.freetv.tv/news,1991/rw-11,3370462/2025-03-27/bw-4---prq-3,5856194","trailer":false,"live":{"type_":"LIVE","id":3370462},"available":true,"timeshiftAvailable":false,"startoverAvailable":false,"catchupTill":"2025-04-10T21:26:00Z","npvrTill":"2025-04-10T21:26:00Z","programRecordingId":7068534,"audio":false,"video":true,"showRecommendations":false,"recommended":false,"premiere":false,"liveBroadcast":false,"slug":"bw-4---prq-3"},{"id":5858584,"publicUid":"1dc296c9-0c28-4202-8b20-cbef56a763f5","title":"אבא משתדל - 5. חבר","lead":"סדרה קומית. יוסי מכיר אב לילד עם צרכים מיוחדים ובין השניים מתפתח קשר בסגנון חיזור גורלי שמערער את יוסי. כ עב.","description":"סדרה קומית. יוסי מכיר אב לילד עם צרכים מיוחדים ובין השניים מתפתח קשר בסגנון חיזור גורלי שמערער את יוסי. כ עב.","ratingEmbedded":false,"type":"PROGRAMME","uhd":false,"since":"2025-03-27T22:17:00Z","till":"2025-03-27T22:43:00Z","images":{"16x9":[{"url":"//d1zqtf09wb8nt5.cloudfront.net/scale/oil/freetv/upload/programme/1070668/COVER/images/1070668_1742202219830.jpg?dsth=177&dstw=315&srcmode=0&srcx=0&srcy=0&quality=65&type=1&srcw=1/1&srch=1/1","templateUrl":"//d1zqtf09wb8nt5.cloudfront.net/scale/oil/freetv/upload/programme/1070668/COVER/images/1070668_1742202219830.jpg?srcmode=0&srcx=0&srcy=0&quality=65&type=1&srcw=1/1&srch=1/1&dsth={height:177}&dstw={width:315}"}]},"genres":[],"webUrl":"https://web.freetv.tv/news,1991/rw-11,3370462/2025-03-27/b-mdl---5-br,5858584","trailer":false,"live":{"type_":"LIVE","id":3370462},"available":true,"timeshiftAvailable":false,"startoverAvailable":false,"catchupTill":"2025-04-10T22:17:00Z","npvrTill":"2025-04-10T22:17:00Z","programRecordingId":7071052,"audio":false,"video":true,"showRecommendations":false,"recommended":false,"premiere":false,"liveBroadcast":false,"slug":"b-mdl---5-br"}]'

  const results = parser({ content }).map(p => {
    p.start = p.start.toJSON()
    p.stop = p.stop.toJSON()
    return p
  })

  expect(results.length).toBe(2)
  expect(results[0]).toMatchObject({
    title: 'בוש 4 - פרק 3',
    description: 'עונה 4 חדשה לדרמה הבלשית. 3. השטן בתוך הבית: הכוח המיוחד מנסה לחקור, ומגלה אליבי שקרי עם השלכות מרעישות. הבלש סנטיאגו רוברטסון צריך לשים את קשריו האישיים בצד למען החקירה. בוש זוכה לביקור פתע לילי.כ עב',
    image: 'https://d1zqtf09wb8nt5.cloudfront.net/scale/oil/freetv/upload/programme/1361162/COVER/images/1361162_1736767668746.jpg?dsth=177&dstw=315&srcmode=0&srcx=0&srcy=0&quality=65&type=1&srcw=1/1&srch=1/1',
    icon: 'https://d1zqtf09wb8nt5.cloudfront.net/scale/oil/freetv/upload/programme/1361162/COVER/images/1361162_1736767668746.jpg?dsth=177&dstw=315&srcmode=0&srcx=0&srcy=0&quality=65&type=1&srcw=1/1&srch=1/1',
    start: '2025-03-27T21:26:00.000Z',
    stop: '2025-03-27T22:17:00.000Z'
  })
  expect(results[1]).toMatchObject({
    title: 'אבא משתדל - 5. חבר',
    description: 'סדרה קומית. יוסי מכיר אב לילד עם צרכים מיוחדים ובין השניים מתפתח קשר בסגנון חיזור גורלי שמערער את יוסי. כ עב.',
    image: 'https://d1zqtf09wb8nt5.cloudfront.net/scale/oil/freetv/upload/programme/1070668/COVER/images/1070668_1742202219830.jpg?dsth=177&dstw=315&srcmode=0&srcx=0&srcy=0&quality=65&type=1&srcw=1/1&srch=1/1',
    icon: 'https://d1zqtf09wb8nt5.cloudfront.net/scale/oil/freetv/upload/programme/1070668/COVER/images/1070668_1742202219830.jpg?dsth=177&dstw=315&srcmode=0&srcx=0&srcy=0&quality=65&type=1&srcw=1/1&srch=1/1',
    start: '2025-03-27T22:17:00.000Z',
    stop: '2025-03-27T22:43:00.000Z'
  })
})

it('can handle empty guide', () => {
  const results = parser({ content: '' })

  expect(results).toMatchObject([])
})
