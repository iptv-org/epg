const axios = require('axios')
const dayjs = require('dayjs')

const API_ENDPOINT = `https://prod.oesp.magentatv.at/oesp/v4/AT/deu/web/programschedules`

module.exports = {
  site: 'magentatv.at',
  url: function ({ date }) {
    return `${API_ENDPOINT}/${date.format('YYYYMMDD')}/1`
  },
  async parser({ content, channel, date }) {
    let programs = []
    let items = parseItems(content, channel)
    if (!items.length) return programs
    const d = date.format('YYYYMMDD')
    const promises = [
      axios.get(`${API_ENDPOINT}/${d}/2`),
      axios.get(`${API_ENDPOINT}/${d}/3`),
      axios.get(`${API_ENDPOINT}/${d}/4`)
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
  async channels() {
    const data = await axios
      .get(`https://prod.oesp.magentatv.at/oesp/v4/AT/deu/web/channels`)
      .then(r => r.data)
      .catch(console.log)

    return data.channels.map(item => {
      return {
        lang: 'de',
        site_id: item.id.replace('lgi-at-prodobo-master:101-', ''),
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
  const data = typeof content === 'string' ? JSON.parse(content) : content
  if (!data || !Array.isArray(data.entries)) return []
  const entity = data.entries.find(e => e.o === `lgi-at-prodobo-master:${channel.site_id}`)

  return entity ? entity.l : []
}
