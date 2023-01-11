const axios = require('axios')
const dayjs = require('dayjs')

module.exports = {
  site: 'tapdmv.com',
  days: 2,
  url({ channel, date }) {
    return `https://epg.tapdmv.com/calendar/${
      channel.site_id
    }?%24limit=10000&%24sort%5BcreatedAt%5D=-1&start=${date.toJSON()}&end=${date
      .add(1, 'd')
      .toJSON()}`
  },
  parser: function ({ content, date }) {
    let programs = []
    const items = parseItems(content, date)
    items.forEach(item => {
      programs.push({
        title: item.program.trim(),
        description: item.description,
        category: item.genre,
        icon: item.thumbnailImage,
        start: parseStart(item),
        stop: parseStop(item)
      })
    })

    return programs
  },
  async channels() {
    const items = await axios
      .get(`https://epg.tapdmv.com/calendar?$limit=10000&$sort[createdAt]=-1`)
      .then(r => r.data.data)
      .catch(console.log)

    return items.map(item => {
      const [_, name] = item.name.match(/epg-tapgo-([^\.]+).json/)
      return {
        site_id: item.id,
        name
      }
    })
  }
}

function parseStart(item) {
  return dayjs(item.startTime)
}

function parseStop(item) {
  return dayjs(item.endTime)
}

function parseItems(content, date) {
  if (!content) return []
  const data = JSON.parse(content)
  if (!Array.isArray(data)) return []
  const d = date.format('YYYY-MM-DD')

  return data.filter(i => i.startTime.includes(d))
}
