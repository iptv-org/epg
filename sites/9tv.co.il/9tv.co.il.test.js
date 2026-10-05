const { parser, url } = require('./9tv.co.il.config.js')
const fs = require('fs')
const path = require('path')
const dayjs = require('dayjs')
const utc = require('dayjs/plugin/utc')
const customParseFormat = require('dayjs/plugin/customParseFormat')
dayjs.extend(customParseFormat)
dayjs.extend(utc)

const date = dayjs.utc('2022-03-06', 'YYYY-MM-DD').startOf('d')
const channel = {
  site_id: '#',
  xmltv_id: 'Channel9.il'
}

it('can generate valid url', () => {
  expect(url({ date })).toBe(
    'https://www.9tv.co.il/BroadcastSchedule/getBrodcastSchedule?date=06/03/2022 00:00:00'
  )
})

it('can parse response', () => {
  const content = fs.readFileSync(path.resolve(__dirname, '__data__/content.html'), 'utf8')
  const result = parser({ content, date }).map(p => {
    p.start = p.start.toJSON()
    p.stop = p.stop.toJSON()
    return p
  })

  expect(result).toMatchObject([
    {
      start: '2022-03-06T04:30:00.000Z',
      stop: '2022-03-06T07:10:00.000Z',
      title: 'Слепая',
      image: 'https://www.9tv.co.il/download/pictures/img_id=8484.jpg',
      description:
        'Она не очень любит говорить о себе или о том, кто и зачем к ней обращается. Живет уединенно, в глуши. Но тех, кто приходит -принимает. Она видит судьбы.'
    },
    {
      start: '2022-03-06T07:10:00.000Z',
      stop: '2022-03-06T08:10:00.000Z',
      image: 'https://www.9tv.co.il/download/pictures/img_id=23694.jpg',
      title: 'Орел и решка. Морской сезон',
      description: 'Орел и решка. Морской сезон. Ведущие -Алина Астровская и Коля Серга.'
    }
  ])
})

it('can handle empty guide', () => {
  const result = parser({
    date,
    channel,
    content: fs.readFileSync(path.resolve(__dirname, '__data__/no_content.html'), 'utf8')
  })
  expect(result).toMatchObject([])
})
