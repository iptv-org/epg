// npx epg-grabber --config=sites/9tv.co.il/9tv.co.il.config.js --channels=sites/9tv.co.il/9tv.co.il.channels.xml --output=guide.xml --days=2

const { parser, url } = require('./9tv.co.il.config.js')
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
  const content = `<li> <a href="#" class="guide_list_link w-inline-block"> <div class="guide_list_time">06:30</div><div class="guide_info_group"> <div class="guide_info_pict" style="background-image: url(/download/pictures/img_id=8484.jpg);"></div><div class="guide_txt_group"> <h3 class="guide_info_title">Слепая</h3> <div>Она не очень любит говорить о себе или о том, кто и зачем к ней обращается. Живет уединенно, в глуши. Но тех, кто приходит -принимает. Она видит судьбы.&#160;</div></div></div></a></li><li> <a href="#" class="guide_list_link even w-inline-block"> <div class="guide_list_time">09:10</div><div class="guide_info_group"> <div class="guide_info_pict" style="background-image: url(/download/pictures/img_id=23694.jpg);"></div><div class="guide_txt_group"> <h3 class="guide_info_title">Орел и решка. Морской сезон</h3> <div>Орел и решка. Морской сезон. Ведущие -Алина Астровская и Коля Серга.</div></div></div></a></li>`
  const result = parser({ content, date }).map(p => {
    p.start = p.start.toJSON()
    p.stop = p.stop.toJSON()
    return p
  })

  expect(result).toMatchObject([
    {
      start: '2022-03-06T04:30:00.000Z',
      stop: '2022-03-06T07:10:00.000Z',
      title: `Слепая`,
      icon: 'https://www.9tv.co.il/download/pictures/img_id=8484.jpg',
      description:
        'Она не очень любит говорить о себе или о том, кто и зачем к ней обращается. Живет уединенно, в глуши. Но тех, кто приходит -принимает. Она видит судьбы.'
    },
    {
      start: '2022-03-06T07:10:00.000Z',
      stop: '2022-03-06T08:10:00.000Z',
      icon: 'https://www.9tv.co.il/download/pictures/img_id=23694.jpg',
      title: `Орел и решка. Морской сезон`,
      description: 'Орел и решка. Морской сезон. Ведущие -Алина Астровская и Коля Серга.'
    }
  ])
})

it('can handle empty guide', () => {
  const result = parser({
    date,
    channel,
    content: `<!DOCTYPE html><html><head></head><body></body></html>`
  })
  expect(result).toMatchObject([])
})
