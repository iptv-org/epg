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
      const image = parseImage($item)

      programs.push({ title, category, start, stop, image })
    })

    return programs
  },
  async channels() {
    const axios = require('axios')

    // prettier-ignore
    const countries = {
      al: { channelsPath: '/al', progsPath: 'al/programacioni', lang: 'sq' },
      at: { channelsPath: '/at', progsPath: 'at/tvprogramm', lang: 'de' },
      ba: { channelsPath: '/ba', progsPath: 'ba/tvprogram', lang: 'bs' },
      bg: { channelsPath: '/bg', progsPath: 'bg/tv-programa', lang: 'bg' },
      ch: { channelsPath: '/ch', progsPath: 'ch/tv-programm', lang: 'de' },
      de: { channelsPath: '/de', progsPath: 'de/tvprogramm', lang: 'de' },
      es: { channelsPath: '/es', progsPath: 'es/programacion-tv', lang: 'es' },
      fr: { channelsPath: '/fr', progsPath: 'fr/programme-tv', lang: 'fr' },
      hr: { channelsPath: '', progsPath: 'tvprogram', lang: 'hr' },
      hu: { channelsPath: '/hu', progsPath: 'hu/tvmusor', lang: 'hu' },
      ie: { channelsPath: '/ie', progsPath: 'ie/tvschedule', lang: 'en' },
      it: { channelsPath: '/it', progsPath: 'it/guida-tv', lang: 'it' },
      ks: { channelsPath: '/ks', progsPath: 'ks/programacioni', lang: 'sq' },
      me: { channelsPath: '/me', progsPath: 'me/tvprogram', lang: 'en' },
      mk: { channelsPath: '/mk', progsPath: 'mk/tv-raspored', lang: 'mk' },
      pl: { channelsPath: '/pl', progsPath: 'pl/program', lang: 'pl' },
      pt: { channelsPath: '/pt', progsPath: 'pt/programacao', lang: 'pt' },
      ro: { channelsPath: '/ro', progsPath: 'ro/program-tv', lang: 'ro' },
      rs: { channelsPath: '/rs', progsPath: 'rs/tvprogram', lang: 'sr' },
      si: { channelsPath: '/si', progsPath: 'si/tvspored', lang: 'sl' },
      tr: { channelsPath: '/tr', progsPath: 'tr/tv-rehberi', lang: 'tr' },
      uk: { channelsPath: '/gb', progsPath: 'gb/tvschedule', lang: 'en' },
    }

    let channels = []
    for (let country in countries) {
      const config = countries[country]
      const lang = config.lang

      const url = `https://tvprofil.com${config.channelsPath}/channels/getChannels/`

      console.log(url)

      const cb = await axios
        .get(url, {
          params: {
            callback: 'cb'
          }
        })
        .then(r => r.data)
        .catch(err => {
          console.error(err.message)
        })

      if (!cb) continue

      const [, json] = cb.match(/^cb\((.*)\)$/i)
      const data = JSON.parse(json)

      data.data.forEach(group => {
        group.channels.forEach(item => {
          channels.push({
            lang,
            site_id: `${config.progsPath}#${item.urlID}`,
            name: item.title
          })
        })
      })
    }

    return channels
  }
}

function parseImage($item) {
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
    callback: 'cb'
  }

  let c = 4
  const a = query.datum + query.kanal + c
  const ua = query.kanal + query.datum

  let i = a.length,
    b = 2

  for (let j = 0; j < ua.length; j++) c += ua.charCodeAt(j)
  while (i--) {
    b += (a.charCodeAt(i) + c * 2) * i
  }

  b = b.toString()
  const key = 'b' + b.charCodeAt(b.length - 1)

  query[key] = b

  return new URLSearchParams(query).toString()
}
