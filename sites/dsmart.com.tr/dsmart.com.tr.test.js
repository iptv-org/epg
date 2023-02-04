// npm run channels:parse -- --config=./sites/dsmart.com.tr/dsmart.com.tr.config.js --output=./sites/dsmart.com.tr/dsmart.com.tr.channels.xml
// npx epg-grabber --config=sites/dsmart.com.tr/dsmart.com.tr.config.js --channels=sites/dsmart.com.tr/dsmart.com.tr.channels.xml --output=guide.xml --timeout=30000 --days=2

const { parser, url } = require('./dsmart.com.tr.config.js')
const dayjs = require('dayjs')
const fs = require('fs')
const path = require('path')
const utc = require('dayjs/plugin/utc')
const customParseFormat = require('dayjs/plugin/customParseFormat')
dayjs.extend(customParseFormat)
dayjs.extend(utc)

const date = dayjs.utc('2023-01-16', 'YYYY-MM-DD').startOf('d')
const channel = {
  site_id: '3#5fe07d7acfef0b1593275751',
  xmltv_id: 'SinemaTV.tr'
}

it('can generate valid url', () => {
  expect(url({ date, channel })).toBe(
    'https://www.dsmart.com.tr/api/v1/public/epg/schedules?page=3&limit=1&day=2023-01-16'
  )
})

it('can parse response', () => {
  const content = fs.readFileSync(path.resolve(__dirname, '__data__/content.json'))
  const results = parser({ channel, content }).map(p => {
    p.start = p.start.toJSON()
    p.stop = p.stop.toJSON()
    return p
  })

  expect(results[0]).toMatchObject({
    start: '2023-01-15T22:00:00.000Z',
    stop: '2023-01-15T23:45:00.000Z',
    title: 'Bizi Ayıran Her Şey',
    category: 'sinema/genel',
    description: `Issızlığın ortasında yer alan orta sınıf bir evde bir anne kız yaşamaktadır. Çevrelerindeki taşları insanlarla yaşadıkları çatışmalar, anne-kızın hayatını olumsuz yönde etkilemektedir. Kızının ansızın ortadan kaybolması, bu çatışmaların seviyesini artıracak ve anne, kızını bulmak için her türlü yola başvuracaktır.`
  })

  expect(results[1]).toMatchObject({
    start: '2023-01-15T23:45:00.000Z',
    stop: '2023-01-16T01:30:00.000Z',
    title: 'Pixie',
    category: 'sinema/genel',
    description: `Annesinin intikamını almak isteyen Pixie, dahiyane bir soygun planlar. Fakat işler planladığı gibi gitmeyince kendini İrlanda’nın vahşi gangsterleri tarafından kovalanan iki adamla birlikte kaçarken bulur.`
  })

  expect(results[12]).toMatchObject({
    start: '2023-01-16T20:30:00.000Z',
    stop: '2023-01-16T22:30:00.000Z',
    title: 'Seberg',
    category: 'sinema/genel',
    description: `Başrolünde ünlü yıldız Kristen Stewart’ın yer aldığı politik gerilim, 1960’ların sonunda insan hakları aktivisti Hakim Jamal ile yaşadığı politik ve romantik ilişki sebebiyle FBI tarafından hedef alınan, Fransız Yeni Dalgası’nın sevilen yüzü ve Serseri Aşıklar’ın yıldızı Jean Seberg’ün çarpıcı hikayesini anlatıyor.`
  })
})

it('can handle empty guide', () => {
  const results = parser({
    channel,
    content: fs.readFileSync(path.resolve(__dirname, '__data__/no_content.json'))
  })

  expect(results).toMatchObject([])
})
