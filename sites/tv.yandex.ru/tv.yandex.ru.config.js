const dayjs = require('dayjs')

module.exports = {
  site: 'tv.yandex.ru',
  days: 2,
  url: function ({ date, channel }) {
    const [region, id] = channel.site_id.split('#')

    return `https://tv.yandex.ru/${region}/channel/${id}?date=${date.format('YYYY-MM-DD')}`
  },
  request: {
    headers: {
      Cookie:
        'yandexuid=8747786251615498142; Expires=Tue, 11 Mar 2031 21:29:02 GMT; Domain=yandex.ru; Path=/'
    }
  },
  parser: function ({ content }) {
    const programs = []
    const items = parseItems(content)
    items.forEach(item => {
      programs.push({
        title: item.title,
        description: item.program.description,
        category: item.program.type.name,
        start: dayjs(item.start),
        stop: dayjs(item.finish)
      })
    })

    return programs
  }
}

function parseContent(content) {
  const [_, initialState] = content.match(/window.__INITIAL_STATE__ = (.*);/i) || [null, null]
  if (!initialState) return null
  const data = JSON.parse(initialState)
  if (!data) return null

  return data.channel
}

function parseItems(content) {
  const data = parseContent(content)
  if (!data || !data.schedule || !Array.isArray(data.schedule.events)) return []

  return data.schedule.events
}
