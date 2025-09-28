const { DateTime } = require('luxon')
const axios = require('axios')

const API_ENDPOINT = 'https://cdn.pt.vtv.vodafone.com/epg'

const headers = {
  Origin: 'https://www.vodafone.pt',
  Referer: 'https://www.vodafone.pt/',
  'User-Agent': 'Mozilla/5.0 (compatible; tv_grab_pt_vodafone)',
  Accept: 'application/json, text/javascript, */*; q=0.01',
  'Accept-Language': 'pt-PT,pt;q=0.9,en;q=0.8'
}

module.exports = {
  site: 'vodafone.pt',
  days: 2,
  request: {
    headers
  },
  url: function ({ channel, date }) {
    const datetime = DateTime.fromJSDate(date.toDate()).setZone('Europe/Lisbon')
    const formattedMonth = datetime.month < 10 ? `0${datetime.month}` : datetime.month
    const formattedDay = datetime.day < 10 ? `0${datetime.day}` : datetime.day
    return `${API_ENDPOINT}/${channel.site_id}/${date.year()}/${formattedMonth}/${formattedDay}/00-06`
  },
  async parser({ content, date, channel }) {
    let programs = []
    let items = parseItems(content)
    if (items.length === 0) return programs
    
    const datetime = DateTime.fromJSDate(date.toDate()).setZone('Europe/Lisbon')
    const formattedMonth = datetime.month < 10 ? `0${datetime.month}` : datetime.month
    const formattedDay = datetime.day < 10 ? `0${datetime.day}` : datetime.day
    
    // Fetch the remaining 3 periods to get a full day schedule
    const promises = [
      axios.get(`${API_ENDPOINT}/${channel.site_id}/${date.year()}/${formattedMonth}/${formattedDay}/06-12`, { headers }),
      axios.get(`${API_ENDPOINT}/${channel.site_id}/${date.year()}/${formattedMonth}/${formattedDay}/12-18`, { headers }),
      axios.get(`${API_ENDPOINT}/${channel.site_id}/${date.year()}/${formattedMonth}/${formattedDay}/18-00`, { headers })
    ]
    
    await Promise.allSettled(promises).then(results => {
      results.forEach(r => {
        if (r.status === 'fulfilled') {
          items = items.concat(parseItems(r.value.data))
        }
      })
    })
    
    for (let item of items) {
      if (!item.startDate || !item.endDate) continue
      let start = DateTime.fromSeconds(item.startDate, { zone: 'UTC' }).toUTC()
      let stop = DateTime.fromSeconds(item.endDate, { zone: 'UTC' }).toUTC()
      if (stop < start) {
        stop = stop.plus({ days: 1 })
      }
      const prog = {
        title: item.name || 'Sem título',
        start,
        stop
      }
      if (item.description) prog.description = item.description
      if (item.metas?.year?.value) prog.year = item.metas.year.value
      if (item.tags?.genre?.objects) {
        prog.category = item.tags.genre.objects.map(g => g.value)
      }
      programs.push(prog)
    }
    return programs
  }
}

function parseItems(content) {
  let json
  try {
    json = typeof content === 'string' ? JSON.parse(content) : content
  } catch {
    return []
  }
  if (!json || !json.result) return []
  const { result } = json
  if (!Array.isArray(result.objects)) return []
  return result.objects
}