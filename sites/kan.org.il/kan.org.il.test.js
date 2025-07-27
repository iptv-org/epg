const { parser, url } = require('./kan.org.il.config.js')
const fs = require('fs')
const path = require('path')
const dayjs = require('dayjs')
const utc = require('dayjs/plugin/utc')
const customParseFormat = require('dayjs/plugin/customParseFormat')
dayjs.extend(customParseFormat)
dayjs.extend(utc)

const date = dayjs.utc('2022-03-06', 'YYYY-MM-DD').startOf('d')
const channel = {
  site_id: '19',
  xmltv_id: 'KANEducational.il'
}

it('can generate valid url', () => {
  expect(url({ channel, date })).toBe(
    'https://www.kan.org.il/tv-guide/tv_guidePrograms.ashx?stationID=19&day=06/03/2022'
  )
})

it('can parse response', () => {
  const content = fs.readFileSync(path.resolve(__dirname, '__data__/content.json'))
  const result = parser({ content }).map(p => {
    p.start = p.start.toJSON()
    p.stop = p.stop.toJSON()
    return p
  })

  expect(result).toMatchObject([
    {
      start: '2022-03-05T22:05:37.000Z',
      stop: '2022-03-05T22:27:12.000Z',
      title: 'ארץ מולדת - בין תורכיה לבריטניה',
      description:
        "קבוצת תלמידים מתארגנת בפרוץ מלחמת העולם הראשונה להגיש עזרה לישוב. באמצעות התלמידים לומד הצופה על בעיותיו של הישוב בתקופת המלחמה, והתלבטותו בין נאמנות לשלטון העות'מאני לבין תקוותיו מהבריטים הכובשים.",
      image: 'https://kanweb.blob.core.windows.net/download/pictures/2021/1/20/imgid=45847_Z.jpeg'
    }
  ])
})

it('can handle empty guide', () => {
  const result = parser({
    content: '[]'
  })
  expect(result).toMatchObject([])
})
