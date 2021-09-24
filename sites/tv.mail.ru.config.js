const dayjs = require('dayjs')
const utc = require('dayjs/plugin/utc')
const timezone = require('dayjs/plugin/timezone')
const customParseFormat = require('dayjs/plugin/customParseFormat')

dayjs.extend(utc)
dayjs.extend(timezone)
dayjs.extend(customParseFormat)

module.exports = {
  lang: 'ru',
  days: 3,
  site: 'tv.mail.ru',
  channels: 'tv.mail.ru.channels.xml',
  output: '.gh-pages/guides/tv.mail.ru.guide.xml',
  url({ channel, date }) {
    return `https://tv.mail.ru/ajax/channel/?region_id=70&channel_id=${
      channel.site_id
    }&date=${date.format('YYYY-MM-DD')}`
  },
  logo({ content }) {
    const json = JSON.parse(content)
    if (json.status !== 'OK') return null

    return json.schedule[0].channel.pic_url_64
  },
  parser({ content, date }) {
    let PM = false
    const programs = []
    const items = parseItems(content)
    items.forEach(item => {
      const title = parseTitle(item)
      const category = parseCategory(item)
      let start = parseStart(item, date)
      if (start.hour() > 11) PM = true
      if (start.hour() < 12 && PM) start = start.add(1, 'd')
      const stop = parseStop(item, date)
      if (programs.length) {
        programs[programs.length - 1].stop = start
      }

      programs.push({
        title,
        category,
        start,
        stop
      })
    })

    return programs
  }
}

function parseStop(item, date) {
  return date.tz('Europe/Moscow').endOf('d').add(6, 'h')
}

function parseStart(item, date) {
  const time = `${date.format('MM/DD/YYYY')} ${item.start}`

  return dayjs.tz(time, 'MM/DD/YYYY HH:mm', 'Europe/Moscow')
}

function parseTitle(item) {
  return item.name
}

function parseCategory(item) {
  const categories = {
    1: 'Фильм',
    2: 'Сериал',
    6: 'Документальное',
    8: 'Позновательное',
    10: 'Другое',
    14: 'ТВ-шоу',
    16: 'Досуг,Хобби',
    17: 'Ток-шоу',
    18: 'Юмористическое',
    24: 'Развлекательное',
    25: 'Игровое',
    26: 'Новости'
  }

  return categories[item.category_id] || null
}

function parseItems(content) {
  const json = JSON.parse(content)
  if (json.status !== 'OK') return []
  const event = json.schedule[0].event

  return [...event.past, ...event.current]
}
