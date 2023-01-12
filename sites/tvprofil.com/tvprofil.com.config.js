const cheerio = require('cheerio')
const dayjs = require('dayjs')

module.exports = {
  site: 'tvprofil.com',
  days: 2,
  url: function ({ channel, date }) {
    const parts = channel.site_id.split('#')
    const query = buildQuery(parts[1], date)

    return `https://tvprofil.com/${parts[0]}/program/?${query}`
  },
  request: {
    headers: {
      'x-requested-with': 'XMLHttpRequest'
    }
  },
  parser: function ({ content }) {
    let programs = []
    const items = parseItems(content)
    items.forEach(item => {
      const $item = cheerio.load(item)
      const title = parseTitle($item)
      const category = parseCategory($item)
      const start = parseStart($item)
      const duration = parseDuration($item)
      const stop = start.add(duration, 's')
      const icon = parseIcon($item)

      programs.push({ title, category, start, stop, icon })
    })

    return programs
  }
}

function parseIcon($item) {
  return $item(':root').data('image')
}

function parseDuration($item) {
  return $item(':root').data('len')
}

function parseStart($item) {
  const timestamp = $item(':root').data('ts')

  return dayjs.unix(timestamp)
}

function parseCategory($item) {
  return $item('.col:nth-child(2) > small').text() || null
}

function parseTitle($item) {
  let title = $item('.col:nth-child(2) > a').text()
  title += $item('.col:nth-child(2)').clone().children().remove().end().text()

  return title.replace('®', '').trim().replace(/,$/, '')
}

function parseItems(content) {
  let data = (content.match(/cb\((.*)\)/) || [null, null])[1]
  if (!data) return []
  let json = JSON.parse(data)
  if (!json || !json.data || !json.data.program) return []

  const $ = cheerio.load(json.data.program)

  return $('.row').toArray()
}

function buildQuery(site_id, date) {
  const query = {
    datum: date.format('YYYY-MM-DD'),
    kanal: site_id,
    callback: `cb`
  }

  const a = query.datum + query.kanal
  const ua = query.kanal + query.datum

  let i = a.length,
    b = 2,
    c = 2

  for (var j = 0; j < ua.length; j++) c += ua.charCodeAt(j)
  while (i--) {
    b += (a.charCodeAt(i) + c * 2) * i
  }

  const key = 'b' + b.toString().charCodeAt(2)

  query[key] = b

  return new URLSearchParams(query).toString()
}
