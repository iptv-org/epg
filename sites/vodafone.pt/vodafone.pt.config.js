const { DateTime } = require('luxon')
const fs = require('fs')
const path = require('path')

module.exports = {
  site: 'vodafone.pt',
  url: 'https://cdn.pt.vtv.vodafone.com/epg/',
  days: 7,
  periods: [
    '06-12', '12-18', '18-00', '00-06',
  ],

  request: {
    method: 'GET',
    headers: {
      Origin: 'https://www.vodafone.pt',
      Referer: 'https://www.vodafone.pt/',
      'User-Agent': 'Mozilla/5.0 (compatible; tv_grab_pt_vodafone)',
      Accept: 'application/json, text/javascript, */*; q=0.01',
      'Accept-Language': 'pt-PT,pt;q=0.9,en;q=0.8'
    },
    path: ({ channel, date, period }) => {
      const raw = String(period || '')
      let p = raw.trim()
      const hasJsonSuffix = /\.json$/i.test(p)
      p = p.replace(/\s+/g, '')
      p = p.replace(/:/g, '-')
      p = p.replace(/_/g, '-')
      p = p.replace(/h$/i, '')
      p = p.replace(/Z$/i, '')
      p = p.replace(/(^|-)0+([0-9])/g, (m, a, b) => (a || '') + b)
      p = p.replace(/[^0-9\-\.]/g, '')
      if (hasJsonSuffix && !/\.json$/i.test(p)) p = p + '.json'
      const year = date.toFormat('yyyy')
      const month = date.toFormat('MM')
      const day = date.toFormat('dd')
      return `${channel}/${year}/${month}/${day}/${p}`
    }
  },

  parser({ content }) {
    if (!content) return []
    let programs = []
    let data
    try {
      data = JSON.parse(content)
    } catch (err) {
      return []
    }
    const items = data?.result?.objects || []
    items.forEach(item => {
      if (!item.startDate || !item.endDate) return
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
    })
    return programs
  },

  async channels() {
    const channelListPath = path.join(__dirname, 'channel.list')
    let content
    try {
      content = fs.readFileSync(channelListPath, 'utf8')
    } catch (err) {
      return []
    }
    const lines = content.split(/\r?\n/)
    const channels = lines
      .map(l => {
        const line = l.replace(/^#.*$/, '').trim()
        if (!line) return null
        let parts = line.split('\t')
        if (parts.length === 1) parts = line.split('|')
        if (parts.length === 1) parts = line.split(/\s+/)
        if (!parts[0]) return null
        const id = parts[0].trim()
        let name = parts[1] ? parts[1].replace(/"/g, '').trim() : id
        const icon = parts[2] ? parts[2].trim() : undefined
        return {
          lang: 'pt',
          site_id: id,
          name,
          icon
        }
      })
      .filter(Boolean)
    return channels
  }
}
