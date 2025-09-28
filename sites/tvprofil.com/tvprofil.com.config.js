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
      'x-requested-with': 'XMLHttpRequest',
      'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/137.0.0.0 Safari/537.36',
      'referer': 'https://tvprofil.com/tvprogram/',
      'accept': 'text/javascript, application/javascript, application/ecmascript, application/x-ecmascript, */*; q=0.01'
    }
  },
  parser: function ({ content }) {
    let programs = []
    const items = parseItems(content)
    items.forEach(item => {
      const $ = cheerio.load(item)
      $('div.row').each((_, el) => {
        const $item = $(el)
        const title = parseTitle($item)
        const category = parseCategory($item)
        const start = parseStart($item)
        const duration = parseDuration($item)
        const stop = start.add(duration, 's')
        const icon = parseImage($item)

        programs.push({ title, category, start, stop, icon })
      })
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
      hr: { channelsPath: '',    progsPath: 'tvprogram', lang: 'hr' },
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
          },
          headers: {
            'x-requested-with': 'XMLHttpRequest',
            'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/137.0.0.0 Safari/537.36',
            'referer': 'https://tvprofil.com/programtv/',
            'accept': 'text/javascript, application/javascript, application/ecmascript, application/x-ecmascript, */*; q=0.01',
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
            xmltv_id: `${item.title.replaceAll(/[ '&]/g, '')}.${country}`,
            name: item.title
          })
        })
      })
    }

    return channels
  }
}

function parseImage($item) {
  return $item.attr('data-image') || null
}

function parseDuration($item) {
  return parseInt($item.attr('data-len'))
}

function parseStart($item) {
  const timestamp = parseInt($item.attr('data-ts'))
  return dayjs.unix(timestamp)
}

function parseCategory($item) {
  return $item.find('.col:nth-child(2) > small').text() || null
}

function parseTitle($item) {
  let title = $item.find('.col:nth-child(2) > a').text()
  title += $item.find('.col:nth-child(2)').clone().children().remove().end().text()

  return title.replace('®', '').trim().replace(/,$/, '')
}

function parseItems(content) {
  let data = (content.match(/^[^(]+\(([\s\S]*)\)$/) || [null, null])[1]
  if (!data) return []
  let json = JSON.parse(data)
  if (!json || !json.data || !json.data.program) return []

  return [json.data.program]
}

function buildQuery(site_id, date) {
  const query = {
    datum: date.format('YYYY-MM-DD'),
    kanal: site_id
    // callback: 'cb' // possibly still working
  }

  let c = 4
  let a = query.datum + query.kanal + c
  let ua = query.kanal + query.datum

  if (
    typeof ua === 'undefined' ||
    ua === null ||
    ua === '' ||
    ua === 0 ||
    ua === '0' ||
    ua !== ua
  ) {
    ua = 'none'
  }

  for (let j = 0; j < ua.length; j++) c += ua.charCodeAt(j)

  let i = a.length
  let b = 2
  while (i--) {
    b += (a.charCodeAt(i) + c * 2) * i
  }

  b = b.toString()
  const lastCharCode = b.charCodeAt(b.length - 1)
  const key = 'b' + lastCharCode
  query['callback'] = `tvprogramit${lastCharCode}`
  query[key] = b

  return new URLSearchParams(query).toString()
}