const axios = require('axios')
const dayjs = require('dayjs')
const utc = require('dayjs/plugin/utc')
const timezone = require('dayjs/plugin/timezone')
dayjs.extend(utc)
dayjs.extend(timezone)

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
    const datetime = dayjs(date.toDate()).tz('Europe/Lisbon')
    const formattedMonth = datetime.month() + 1 < 10 ? `0${datetime.month() + 1}` : datetime.month() + 1
    const formattedDay = datetime.date() < 10 ? `0${datetime.date()}` : datetime.date()
    return `${API_ENDPOINT}/${channel.site_id}/${datetime.year()}/${formattedMonth}/${formattedDay}/00-06`
  },
  async parser({ content, date, channel }) {
    let programs = []
    let items = parseItems(content)
    if (items.length === 0) return programs
    
    const datetime = dayjs(date.toDate()).tz('Europe/Lisbon')
    const formattedMonth = datetime.month() + 1 < 10 ? `0${datetime.month() + 1}` : datetime.month() + 1
    const formattedDay = datetime.date() < 10 ? `0${datetime.date()}` : datetime.date()
    
    // Fetch the remaining 3 periods to get a full day schedule
    const promises = [
      axios.get(`${API_ENDPOINT}/${channel.site_id}/${datetime.year()}/${formattedMonth}/${formattedDay}/06-12`, { headers }),
      axios.get(`${API_ENDPOINT}/${channel.site_id}/${datetime.year()}/${formattedMonth}/${formattedDay}/12-18`, { headers }),
      axios.get(`${API_ENDPOINT}/${channel.site_id}/${datetime.year()}/${formattedMonth}/${formattedDay}/18-00`, { headers })
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
      let start = dayjs.unix(item.startDate).utc()
      let stop = dayjs.unix(item.endDate).utc()
      if (stop < start) {
        stop = stop.add(1, 'day')
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