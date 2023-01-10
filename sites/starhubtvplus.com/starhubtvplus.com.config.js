const axios = require('axios')
const dayjs = require('dayjs')

const APP_KEY = '5ee2ef931de1c4001b2e7fa3_5ee2ec25a0e845001c1783dc'
const SESSION_KEY = '01G2QG0N3RWDNCBA1S5MK1MD2K17CE4431A2'

module.exports = {
  site: 'starhubtvplus.com',
  days: 2,
  request: {
    headers: {
      'x-application-key': APP_KEY,
      'x-application-session': SESSION_KEY
    },
    cache: {
      ttl: 60 * 60 * 1000 // 1h
    }
  },
  url: function ({ date }) {
    const variables = JSON.stringify({
      category: '',
      dateFrom: date.format('YYYY-MM-DD'),
      dateTo: date.add(1, 'd').format('YYYY-MM-DD')
    })
    const query = `query webFilteredEpg($category: String, $dateFrom: DateWithoutTime, $dateTo: DateWithoutTime!) { nagraEpg(category: $category) { items { id: tvChannel image name: longName programs: programsByDate(dateFrom: $dateFrom, dateTo: $dateTo) { id title description Categories startTime endTime }}}}`

    const params = `operationName=webFilteredEpg&variables=${encodeURIComponent(
      variables
    )}&query=${encodeURIComponent(query)}`

    return `https://api.starhubtvplus.com/epg?${params}`
  },
  parser: function ({ content, channel, cached }) {
    let programs = []
    const items = parseItems(content, channel)
    items.forEach(item => {
      programs.push({
        title: item.title,
        description: item.description,
        category: item.Categories,
        start: parseStart(item),
        stop: parseStop(item)
      })
    })

    return programs
  },
  async channels() {
    const items = await axios
      .get(
        `https://api.starhubtvplus.com/epg?operationName=webFilteredEpg&variables=%7B%22category%22%3A%22%22,%22dateFrom%22%3A%222022-05-10%22,%22dateTo%22%3A%222022-05-11%22%7D&query=query%20webFilteredEpg(%24category%3A%20String)%20%7B%20nagraEpg(category%3A%20%24category)%20%7B%20items%20%7B%20id%3A%20tvChannel%20image%20name%3A%20longName%20%7D%7D%7D`,
        {
          headers: {
            'x-application-key': APP_KEY,
            'x-application-session': SESSION_KEY
          }
        }
      )
      .then(r => r.data.data.nagraEpg.items)
      .catch(console.log)

    return items.map(item => ({
      site_id: item.id,
      name: item.name.replace('_DASH', '')
    }))
  }
}

function parseStart(item) {
  return dayjs(item.startTime)
}

function parseStop(item) {
  return dayjs(item.endTime)
}

function parseItems(content, channel) {
  const data = JSON.parse(content)
  if (!data || !data.data || !data.data.nagraEpg || !Array.isArray(data.data.nagraEpg.items))
    return []
  const ch = data.data.nagraEpg.items.find(ch => ch.id == channel.site_id)

  return ch && Array.isArray(ch.programs) ? ch.programs : []
}
