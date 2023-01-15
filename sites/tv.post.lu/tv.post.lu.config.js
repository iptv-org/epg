const axios = require('axios')
const dayjs = require('dayjs')

module.exports = {
  site: 'tv.post.lu',
  days: 2,
  url({ channel, date }) {
    return `https://tv.post.lu/api/channels?id=${channel.site_id}&date=${date.format('YYYY-MM-DD')}`
  },
  parser({ content, channel, date }) {
    let programs = []
    const items = parseItems(content)
    items.forEach(item => {
      programs.push({
        title: item.title,
        description: item.description,
        category: item.program_type,
        icon: item.image_url,
        start: dayjs.unix(item.tsStart),
        stop: dayjs.unix(item.tsEnd)
      })
    })

    return programs
  },
  async channels() {
    const promises = [...Array(17).keys()].map(i =>
      axios.get(`https://tv.post.lu/api/channels/?page=${i + 1}`)
    )

    const channels = []
    await Promise.all(promises).then(values => {
      values.forEach(r => {
        let items = r.data.result.data
        items.forEach(item => {
          channels.push({
            lang: item.language.code,
            name: item.name,
            site_id: item.id
          })
        })
      })
    })

    return channels
  }
}

function parseItems(content) {
  if (!content) return []
  const data = JSON.parse(content)
  if (!data || !data.result || !data.result.epg || !Array.isArray(data.result.epg.programme))
    return []

  return data.result.epg.programme
}
