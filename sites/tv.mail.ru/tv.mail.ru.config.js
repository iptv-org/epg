const dayjs = require('dayjs')
const utc = require('dayjs/plugin/utc')
const timezone = require('dayjs/plugin/timezone')
const customParseFormat = require('dayjs/plugin/customParseFormat')

dayjs.extend(utc)
dayjs.extend(timezone)
dayjs.extend(customParseFormat)

module.exports = {
  site: 'tv.mail.ru',
  days: 2,
  url({ channel, date }) {
    return `https://tv.mail.ru/ajax/channel/?region_id=70&channel_id=${
      channel.site_id
    }&date=${date.format('YYYY-MM-DD')}`
  },
  parser({ content, date }) {
    const programs = []
    const items = parseItems(content)
    items.forEach(item => {
      const prev = programs[programs.length - 1]
      let start = parseStart(item, date)
      if (prev) {
        if (start.isBefore(prev.start)) {
          start = start.add(1, 'd')
          date = date.add(1, 'd')
        }
        prev.stop = start
      }
      const stop = start.add(1, 'h')
      programs.push({
        title: item.name,
        category: parseCategory(item),
        start,
        stop
      })
    })

    return programs
  }
}

function parseStart(item, date) {
  const dateString = `${date.format('YYYY-MM-DD')} ${item.start}`

  return dayjs.tz(dateString, 'YYYY-MM-DD HH:mm', 'Europe/Moscow')
}

function parseCategory(item) {
  const categories = {
    1: 'Фильм',
    2: 'Сериал',
    6: 'Документальное',
    7: 'Телемагазин',
    8: 'Позновательное',
    10: 'Другое',
    14: 'ТВ-шоу',
    16: 'Досуг,Хобби',
    17: 'Ток-шоу',
    18: 'Юмористическое',
    23: 'Музыка',
    24: 'Развлекательное',
    25: 'Игровое',
    26: 'Новости'
  }

  return categories[item.category_id]
}

function parseItems(content) {
  const json = JSON.parse(content)
  if (!Array.isArray(json.schedule) || !json.schedule[0]) return []
  const event = json.schedule[0].event || []

  return [...event.past, ...event.current]
}
