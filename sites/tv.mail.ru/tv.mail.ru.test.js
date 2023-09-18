// npx epg-grabber --config=sites/tv.mail.ru/tv.mail.ru.config.js --channels=sites/tv.mail.ru/tv.mail.ru.channels.xml --output=guide.xml

const { parser, url } = require('./tv.mail.ru.config.js')
const dayjs = require('dayjs')
const utc = require('dayjs/plugin/utc')
const customParseFormat = require('dayjs/plugin/customParseFormat')
dayjs.extend(customParseFormat)
dayjs.extend(utc)

const date = dayjs.utc('2021-11-24', 'YYYY-MM-DD').startOf('d')
const channel = {
  site_id: '2785',
  xmltv_id: '21TV.am'
}
const content = `{"status":"OK","schedule":[{"channel":{"name":"21TV","pic_url":"https://resizer.mail.ru/p/1234c5ac-c19c-5cf2-9c6a-fc0efca920ac/AAACm2w9aDpGPSWXzsH7PBq2X3I6pbxqmrj-yeuVppAKyyBHXE_dH_7pHQ2rOavyKiC4iHIWTab9SeKo7pKgr71lqVA.png","pic_url_128":"https://resizer.mail.ru/p/1234c5ac-c19c-5cf2-9c6a-fc0efca920ac/AAACwjJ45j9sTP8fcjPJnJ4xk5e_ILr5iXwjLMhWhzlVnIJkrtT42vEp9walcgpXRKDq9KFoliEPR0xI-LEh96C_izY.png","pic_url_64":"https://resizer.mail.ru/p/1234c5ac-c19c-5cf2-9c6a-fc0efca920ac/dpr:200/AAACm2w9aDpGPSWXzsH7PBq2X3I6pbxqmrj-yeuVppAKyyBHXE_dH_7pHQ2rOavyKiC4iHIWTab9SeKo7pKgr71lqVA.png"},"event":{"current":[{"channel_id":"2785","name":"Պրոֆեսիոնալները","category_id":8,"episode_title":"","url":"/moskva/channel/2785/173593246/","id":"173593246","start":"02:40","episode_num":0},{"channel_id":"2785","name":"Նոնստոպ․ Տեսահոլովակներ","category_id":23,"episode_title":"","url":"/moskva/channel/2785/173593142/","id":"173593142","start":"03:25","episode_num":0}],"past":[{"channel_id":"2785","name":"Նոնստոպ․ Տեսահոլովակներ","category_id":23,"episode_title":"","url":"/moskva/channel/2785/173593328/","id":"173593328","start":"23:35","episode_num":0},{"channel_id":"2785","video":{"currency":"RUB","price_min":"249.00","price_txt":"249 р."},"name":"Վերջին թագավորությունը","category_id":2,"episode_title":"","url":"/moskva/channel/2785/173593318/","id":"173593318","start":"01:40","our_event_id":"890224","episode_num":0}]}}]}`

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
      title: `Նոնստոպ․ Տեսահոլովակներ`,
      category: {
        lang: 'ru',
        value: 'Музыка'
      }
    },
    {
      start: '2021-11-24T22:40:00.000Z',
      stop: '2021-11-24T23:40:00.000Z',
      title: `Վերջին թագավորությունը`,
      category: {
        lang: 'ru',
        value: 'Сериал'
      }
    },
    {
      start: '2021-11-24T23:40:00.000Z',
      stop: '2021-11-25T00:25:00.000Z',
      title: `Պրոֆեսիոնալները`,
      category: {
        lang: 'ru',
        value: 'Позновательное'
      }
    },
    {
      start: '2021-11-25T00:25:00.000Z',
      stop: '2021-11-25T01:25:00.000Z',
      title: `Նոնստոպ․ Տեսահոլովակներ`,
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
    content: `{"status":"OK","current_ts":1637788593,"form":{"values":[]},"current_offset":10800,"schedule":[{"channel":null,"event":{"current":[],"past":[]}}]}`
  })
  expect(result).toMatchObject([])
})
