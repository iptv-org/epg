const dayjs = require('dayjs')
const axios = require('axios')

const apiUrl = 'https://programme-tv.vini.pf/programmesJSON'

module.exports = {
  site: 'programme-tv.vini.pf',
  days: 2,
  url: apiUrl,
  request: {
    method: 'POST',
    data({ date }) {
      return {
        dateDebut: `${date.subtract(10, 'h').format('YYYY-MM-DDTHH:mm:ss')}-10:00`
      }
    }
  },
  parser: async function ({ content, channel, date }) {
    const programs = []
    const items = parseItems(content, channel)
    if (items.length) {
      for (let hours of [2, 4, 6, 8, 10, 12, 14, 16, 18, 20, 22]) {
        const nextContent = await loadNextItems(date, hours)
        const nextItems = parseItems(nextContent, channel)
        for (let item of nextItems) {
          if (!items.find(i => i.nidP === item.nidP)) {
            items.push(item)
          }
        }
      }
    }

    items.forEach(item => {
      programs.push({
        title: item.titreP,
        description: item.desc,
        category: item.categorieP,
        image: item.srcP,
        start: dayjs.unix(item.timestampDeb),
        stop: dayjs.unix(item.timestampFin)
      })
    })

    return programs
  },
  async channels() {
    const data = await axios
      .post('https://programme-tv.vini.pf/programmesJSON')
      .then(r => r.data)
      .catch(console.log)

    return data.programmes.map(item => {
      const site_id = item.url.replace('/', '')
      const name = site_id.replace(/-/gi, ' ')

      return {
        lang: 'fr',
        site_id,
        name
      }
    })
  }
}

async function loadNextItems(date, hours) {
  date = date.add(hours, 'h')

  return axios
    .post(
      apiUrl,
      {
        dateDebut: `${date.subtract(10, 'h').format('YYYY-MM-DDTHH:mm:ss')}-10:00`
      },
      {
        responseType: 'arraybuffer'
      }
    )
    .then(res => res.data.toString())
    .catch(console.log)
}

function parseItems(content, channel) {
  if (!content) return []
  const data = JSON.parse(content)
  if (!data || !Array.isArray(data.programmes)) return []
  const channelData = data.programmes.find(i => i.url === `/${channel.site_id}`)
  if (!channelData) return []

  return channelData.programmes || []
}
