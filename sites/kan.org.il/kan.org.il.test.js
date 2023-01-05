// npx epg-grabber --config=sites/kan.org.il/kan.org.il.config.js --channels=sites/kan.org.il/kan.org.il.channels.xml --output=guide.xml --days=2

const { parser, url } = require('./kan.org.il.config.js')
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
  const content = `[{"title":"ארץ מולדת - בין תורכיה לבריטניה","start_time":"2022-03-06T00:05:37","end_time":"2022-03-06T00:27:12","id":"2598","age_category_desc":"0","epg_name":"ארץ מולדת","title1":"ארץ מולדת - בין תורכיה לבריטניה","chapter_number":"9","live_desc":"קבוצת תלמידים מתארגנת בפרוץ מלחמת העולם הראשונה להגיש עזרה לישוב. באמצעות התלמידים לומד הצופה על בעיותיו של הישוב בתקופת המלחמה, והתלבטותו בין נאמנות לשלטון העות'מאני לבין תקוותיו מהבריטים הכובשים.","Station_Radio":"0","Station_Id":"20","stationUrlScheme":"kan11://plugin/?type=player&plugin_identifier=kan_player&ds=general-provider%3A%2F%2FfetchData%3Ftype%3DFEED_JSON%26url%3DaHR0cHM6Ly93d3cua2FuLm9yZy5pbC9hcHBLYW4vbGl2ZVN0YXRpb25zLmFzaHg%3D&id=4","program_code":"3671","picture_code":"https://kanweb.blob.core.windows.net/download/pictures/2021/1/20/imgid=45847_Z.jpeg","program_image":"","station_image":"Logo_Image_Logo20_img__8.jpg","program_id":"","timezone":"2"}]`
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
      icon: 'https://kanweb.blob.core.windows.net/download/pictures/2021/1/20/imgid=45847_Z.jpeg'
    }
  ])
})

it('can handle empty guide', () => {
  const result = parser({
    content: `[]`
  })
  expect(result).toMatchObject([])
})
