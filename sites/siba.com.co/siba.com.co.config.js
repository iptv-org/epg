const dayjs = require('dayjs')
const axios = require('axios')

// Geo to Colombia
module.exports = {
  site: 'siba.com.co',
  days: 2,
  url: 'http://devportal.siba.com.co/index.php?action=grilla',
  request: {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8'
    },
    data({ channel, date }) {
      const params = new URLSearchParams()
      params.append('servicio', '9')
      params.append('ini', date.unix())
      params.append('end', date.add(1, 'd').unix())
      params.append('chn', channel.site_id)

      return params
    }
  },
  parser: function ({ content, channel }) {
    let programs = []
    const items = parseItems(content, channel)
    items.forEach(item => {
      programs.push({
        title: item.nom,
        start: parseStart(item).toJSON(),
        stop: parseStop(item).toJSON()
      })
    })

    return programs
  },
  async channels() {
    const data = await axios
      .post('http://devportal.siba.com.co/index.php?action=grilla', 'servicio=9', {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8'
        }
      })
      .then(r => r.data)
      .catch(console.log)

    return data.list.map(item => {
      return {
        lang: 'es',
        site_id: item.id,
        name: item.nom
      }
    })
  }
}

function parseStart(item) {
  return dayjs.unix(item.ini)
}

function parseStop(item) {
  return dayjs.unix(item.fin)
}

function parseContent(content, channel) {
  const data = JSON.parse(content)
  if (!data || !Array.isArray(data.list)) return null

  return data.list.find(i => i.id === channel.site_id)
}

function parseItems(content, channel) {
  const data = parseContent(content, channel)

  return data ? data.prog : []
}
