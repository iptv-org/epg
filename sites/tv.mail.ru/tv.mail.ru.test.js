const { parser, url } = require('./tv.mail.ru.config.js')
const dayjs = require('dayjs')
const utc = require('dayjs/plugin/utc')
const customParseFormat = require('dayjs/plugin/customParseFormat')
const fs = require('fs')
const path = require('path')
dayjs.extend(customParseFormat)
dayjs.extend(utc)

const date = dayjs.utc('2021-11-24', 'YYYY-MM-DD').startOf('d')
const channel = {
  site_id: '2785',
  xmltv_id: '21TV.am'
}
const content = fs.readFileSync(path.join(__dirname, '__data__', 'content.json'), 'utf8')

it('can generate valid url', () => {
  expect(url({ channel, date })).toBe(
    'https://tv.mail.ru/ajax/channel/?region_id=70&channel_id=2785&date=2021-11-24'
  )
})

it('can parse response', () => {
  const result = parser({ content, date }).map(p => {
    p.start = p.start.toJSON()
    p.stop = p.stop.toJSON()
    return p
  })

  expect(result).toMatchObject([
    {
      start: '2021-11-24T20:35:00.000Z',
      stop: '2021-11-24T22:40:00.000Z',
      title: 'Նոնստոպ․ Տեսահոլովակներ',
      category: {
        lang: 'ru',
        value: 'Музыка'
      }
    },
    {
      start: '2021-11-24T22:40:00.000Z',
      stop: '2021-11-24T23:40:00.000Z',
      title: 'Վերջին թագավորությունը',
      category: {
        lang: 'ru',
        value: 'Сериал'
      }
    },
    {
      start: '2021-11-24T23:40:00.000Z',
      stop: '2021-11-25T00:25:00.000Z',
      title: 'Պրոֆեսիոնալները',
      category: {
        lang: 'ru',
        value: 'Позновательное'
      }
    },
    {
      start: '2021-11-25T00:25:00.000Z',
      stop: '2021-11-25T01:25:00.000Z',
      title: 'Նոնստոպ․ Տեսահոլովակներ',
      category: {
        lang: 'ru',
        value: 'Музыка'
      }
    }
  ])
})

it('can handle empty guide', () => {
  const result = parser({
    date,
    channel,
    content: fs.readFileSync(path.join(__dirname, '__data__', 'no_content.json'), 'utf8')
  })
  expect(result).toMatchObject([])
})
