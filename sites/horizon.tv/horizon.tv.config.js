const axios = require('axios')
const dayjs = require('dayjs')

const API_ENDPOINT = `https://legacy-static.oesp.horizon.tv/oesp/v4`

module.exports = {
  site: 'horizon.tv',
  days: 2,
  url: function ({ date, channel }) {
    const [country, lang] = channel.site_id.split('#')

    return `${API_ENDPOINT}/${country}/${lang}/web/programschedules/${date.format('YYYYMMDD')}/1`
  },
  async parser({ content, channel, date }) {
    const [country, lang] = channel.site_id.split('#')
    let programs = []
    let items = parseItems(content, channel)
    if (!items.length) return programs
    const d = date.format('YYYYMMDD')
    const promises = [
      axios.get(`${API_ENDPOINT}/${country}/${lang}/web/programschedules/${d}/2`),
      axios.get(`${API_ENDPOINT}/${country}/${lang}/web/programschedules/${d}/3`),
      axios.get(`${API_ENDPOINT}/${country}/${lang}/web/programschedules/${d}/4`)
    ]
    await Promise.allSettled(promises)
      .then(results => {
        results.forEach(r => {
          if (r.status === 'fulfilled') {
            items = items.concat(parseItems(r.value.data, channel))
          }
        })
      })
      .catch(console.error)
    items.forEach(item => {
      programs.push({
        title: item.t,
        start: parseStart(item),
        stop: parseStop(item)
      })
    })

    return programs
  },
  async channels({ country, lang }) {
    const langs = { deu: 'de', slk: 'sk' }
    const data = await axios
      .get(`https://legacy-dynamic.oesp.horizon.tv/oesp/v4/${country}/${lang}/web/channels`)
      .then(r => r.data)
      .catch(console.log)

    return data.channels.map(item => {
      return {
        lang: langs[lang],
        site_id: `${country}#${lang}#${item.stationSchedules[0].station.id}`,
        name: item.title
      }
    })
  }
}

function parseStart(item) {
  return dayjs(item.s)
}

function parseStop(item) {
  return dayjs(item.e)
}

function parseItems(content, channel) {
  const [_, __, channelId] = channel.site_id.split('#')
  const data = typeof content === 'string' ? JSON.parse(content) : content
  if (!data || !Array.isArray(data.entries)) return []
  const entity = data.entries.find(e => e.o === channelId)

  return entity ? entity.l : []
}
