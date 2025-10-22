const { parser, url } = require('./roya-tv.com.config.js')
const fs = require('fs')
const path = require('path')
const dayjs = require('dayjs')
const utc = require('dayjs/plugin/utc')
const customParseFormat = require('dayjs/plugin/customParseFormat')
dayjs.extend(customParseFormat)
dayjs.extend(utc)

const channel = { site_id: '3' }
const date = dayjs.utc('2025-08-13', 'YYYY-MM-DD').startOf('d')

it('can generate valid url for today', () => {
  const date = dayjs.utc().startOf('d')
  expect(url({ date })).toBe(
    'https://backend.roya.tv/api/v01/channels/schedule-pagination?day_number=0'
  )
})

it('can generate valid url for tomorrow', () => {
  const date = dayjs.utc().startOf('d').add(1, 'd')
  expect(url({ date })).toBe(
    'https://backend.roya.tv/api/v01/channels/schedule-pagination?day_number=1'
  )
})

it('can parse response', () => {
  const content = fs.readFileSync(path.resolve(__dirname, '__data__/content.json'))

  let results = parser({ content, channel, date })
  results = results.map(p => {
    p.start = p.start.toJSON()
    p.stop = p.stop.toJSON()

    return p
  })

  expect(results.length).toBe(52)
  expect(results[0]).toMatchObject({
    title: 'فلانتينو',
    description:
      'نور عبد الحميد، المعروف بـ (فلانتينو)، وزوجته عفاف، يمتلكان سلسلة مدارس باسم "مدارس فلانتينو". بسبب سيطرتهما وقوتهما، تنشأ بينهما العديد من الخلافات خلال أحداث المسلسل، ومن هنا تنطلق المغامرات والمفاجآت.',
    image:
      'https://backend.roya-tv.com/imagechanger/Size03Q40R169/images/programs/1345/vJKYA3DfsDQf9QA.webp',
    start: '2025-08-12T21:00:00.000Z',
    stop: '2025-08-12T21:36:11.000Z'
  })
  expect(results[51]).toMatchObject({
    title: 'الخربة',
    description:
      'يسرد مسلسل "الخربة" حكاية حياة عائلتين كبيرتين، بو قعقور بقيادة بو نمر (دريد لحام)، وبو مالحة بقيادة بو نايف (رشيد عساف)، \nحيث تتنافس كل عائلة على إزعاج الأخرى في أجواء كوميدية ساخرة.',
    image:
      'https://backend.roya-tv.com/imagechanger/Size03Q40R169/images/programs/517/3ZFod064OkM0GfO.jpg',
    start: '2025-08-13T20:40:19.000Z',
    stop: '2025-08-13T21:00:00.000Z'
  })
})

it('can handle empty guide', () => {
  const content = fs.readFileSync(path.resolve(__dirname, '__data__/no_content.json'))
  const results = parser({ content, channel, date })

  expect(results).toMatchObject([])
})
