const { parser, url } = require('./rtmklik.rtm.gov.my.config.js')
const fs = require('fs')
const path = require('path')
const dayjs = require('dayjs')
const utc = require('dayjs/plugin/utc')
const customParseFormat = require('dayjs/plugin/customParseFormat')
dayjs.extend(customParseFormat)
dayjs.extend(utc)

const date = dayjs.utc('2022-09-04', 'YYYY-MM-DD').startOf('d')
const channel = {
  site_id: '2',
  xmltv_id: 'TV2.my'
}

it('can generate valid url', () => {
  expect(url({ date, channel })).toBe(
    'https://rtm.glueapi.io/v3/epg/2/ChannelSchedule?dateStart=2022-09-04&dateEnd=2022-09-04&timezone=0'
  )
})

it('can parse response', () => {
  const content = fs.readFileSync(path.resolve(__dirname, '__data__/content.json'))
  const result = parser({ content, channel, date }).map(p => {
    p.start = p.start.toJSON()
    p.stop = p.stop.toJSON()
    return p
  })

  expect(result).toMatchObject([
    {
      start: '2022-09-04T19:00:00.000Z',
      stop: '2022-09-04T20:00:00.000Z',
      title: 'Hope Of Life',
      description:
        'Kisah kehidupan 3 pakar bedah yang berbeza status dan latar belakang, namun mereka komited dengan kerjaya mereka sebagai doktor. Lakonan : Johnson Low, Elvis Chin, Mayjune Tan, Kelvin Liew, Jacky Kam dan Katrina Ho.'
    }
  ])
})

it('can handle empty guide', () => {
  const result = parser({
    date,
    channel,
    content: fs.readFileSync(path.resolve(__dirname, '__data__/no_content.json'))
  })
  expect(result).toMatchObject([])
})
