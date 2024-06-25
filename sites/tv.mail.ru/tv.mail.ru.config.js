const { DateTime } = require('luxon')
const axios = require('axios')

module.exports = {
  site: 'tv.mail.ru',
  days: 2,
  delay: 1000,
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
        if (start < prev.start) {
          start = start.plus({ days: 1 })
          date = date.add(1, 'd')
        }
        prev.stop = start
      }
      const stop = start.plus({ hours: 1 })
      programs.push({
        title: item.name,
        category: parseCategory(item),
        start,
        stop
      })
    })

    return programs
  },
  async channels() {
    const regions = [5506, 1096, 1125, 285]

    let channels = []
    for (let region of regions) {
      const totalPages = await getTotalPageCount(region)
      const pages = Array.from(Array(totalPages).keys())
      for (let page of pages) {
        const data = await axios
          .get('https://tv.mail.ru/ajax/channel/list/', {
            params: { page },
            headers: {
              cookie: `s=fver=0|geo=${region};`
            }
          })
          .then(r => r.data)
          .catch(console.log)

        data.channels.forEach(item => {
          channels.push({
            lang: 'ru',
            name: item.name,
            site_id: item.id
          })
        })
      }
    }

    return [...new Map(channels.map(channel => [channel.site_id, channel])).values()]
  }
}

async function getTotalPageCount(region) {
  const data = await axios
    .get(`https://tv.mail.ru/ajax/channel/list/`, {
      params: { page: 0 },
      headers: {
        cookie: `s=fver=0|geo=${region};`
      }
    })
    .then(r => r.data)
    .catch(console.log)

  return data.total
}

function parseStart(item, date) {
  const dateString = `${date.format('YYYY-MM-DD')} ${item.start}`

  return DateTime.fromFormat(dateString, 'yyyy-MM-dd HH:mm', { zone: 'Europe/Moscow' }).toUTC()
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
    ? {
        lang: 'ru',
        value: categories[item.category_id]
      }
    : null
}

function parseItems(content) {
  const json = JSON.parse(content)
  if (!Array.isArray(json.schedule) || !json.schedule[0]) return []
  const event = json.schedule[0].event || []

  return [...event.past, ...event.current]
}
