const { parser, url, request } = require('./sat.tv.config.js')
const fs = require('fs')
const path = require('path')
const dayjs = require('dayjs')
const utc = require('dayjs/plugin/utc')
const customParseFormat = require('dayjs/plugin/customParseFormat')
dayjs.extend(customParseFormat)
dayjs.extend(utc)

const date = dayjs.utc('2023-06-26', 'YYYY-MM-DD').startOf('d')
const channel = {
  site_id: '1#38#السعودية',
  xmltv_id: 'AlSaudiya.sa',
  lang: 'ar'
}

it('can generate valid url', () => {
  expect(url).toBe('https://www.sat.tv/wp-content/themes/twentytwenty-child/ajax_chaines.php')
})

it('can generate valid request method', () => {
  expect(request.method).toBe('POST')
})

it('can generate valid request headers', () => {
  expect(request.headers({ channel })).toMatchObject({
    'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
    Cookie: 'pll_language=ar'
  })
})

it('can generate valid request data', () => {
  const data = request.data({ channel, date })
  expect(data.get('dateFiltre')).toBe('2023-06-26')
  expect(data.get('hoursFiltre')).toBe('0')
  expect(data.get('satLineup')).toBe('38')
  expect(data.get('satSatellite')).toBe('1')
  expect(data.get('userDateTime')).toBe('1687737600000')
  expect(data.get('userTimezone')).toBe('Europe/London')
})

it('can parse response', () => {
  const content = fs.readFileSync(path.resolve(__dirname, '__data__/content_ar.html'))
  const results = parser({ content, date, channel }).map(p => {
    p.start = p.start.toJSON()
    p.stop = p.stop.toJSON()
    return p
  })

  expect(results.length).toBe(35)
  expect(results[0]).toMatchObject({
    start: '2023-06-26T06:30:00.000Z',
    stop: '2023-06-26T07:00:00.000Z',
    title: 'تعظيم البلد الحرام',
    description: `الناس, دين, ثقافة
يلقي صانع الفيلم الضوء على مشروع تعظيم البلد الحرام في مكة من العائلة الملكية في المملكة العربية السعودية، والذي يهدف لإبراز حرمته لدى المسلمين حول العالم.`,
    image: null
  })

  expect(results[34]).toMatchObject({
    start: '2023-06-26T22:30:00.000Z',
    stop: '2023-06-27T01:00:00.000Z',
    title: 'الأخبار',
    description: `نشرة
.يطرح أهم القضايا والأحداث على الساحة السعودية والعالمية`,
    image:
      'https://sat.tv/wp-content/themes/twentytwenty-child/data_lineups/nilesat/images3/epg-3077892.jpg'
  })
})

it('can parse response in english', () => {
  const channel = {
    site_id: '1#38#Saudi HD',
    xmltv_id: 'AlSaudiya.sa',
    lang: 'en'
  }
  const content = fs.readFileSync(path.resolve(__dirname, '__data__/content_en.html'))
  const results = parser({ content, date, channel }).map(p => {
    p.start = p.start.toJSON()
    p.stop = p.stop.toJSON()
    return p
  })

  expect(results.length).toBe(32)
  expect(results[0]).toMatchObject({
    start: '2023-06-26T09:00:00.000Z',
    stop: '2023-06-26T10:00:00.000Z',
    title: 'News',
    description: `Newscast
The most important issues and events on the Saudi and the world.`,
    image:
      'https://sat.tv/wp-content/themes/twentytwenty-child/data_lineups/nilesat/images3/epg-3077892.jpg'
  })

  expect(results[31]).toMatchObject({
    start: '2023-06-26T23:15:00.000Z',
    stop: '2023-06-27T00:00:00.000Z',
    title: "Bride's Father",
    description: `Romance, Drama, Family
2022
Abdelhamid's family struggles to deal with the challenges of life that keep flowing one by one. they manage to stay strong-armed with their love and trust for each other.
Sayed Ragab, Sawsan  Badr, Medhat Saleh, Nermine Al Feqy, Mohamed Adel, Khaled Kamal, Rania Farid, Hani Kamal, Hani Kamal`,
    image:
      'https://sat.tv/wp-content/themes/twentytwenty-child/data_lineups/nilesat/images3/epg-3157177.jpg'
  })
})

it('can handle empty guide', () => {
  const content = fs.readFileSync(path.resolve(__dirname, '__data__/no_content.html'))
  const result = parser({ content, date, channel })
  expect(result).toMatchObject([])
})
