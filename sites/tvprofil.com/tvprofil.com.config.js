const cheerio = require('cheerio')
const dayjs = require('dayjs')
const axios = require('axios')

const USER_AGENT =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/137.0.0.0 Safari/537.36'

// Base headers for the program (JSONP) request. The session cookie is added per request.
const HEADERS = {
  'x-requested-with': 'XMLHttpRequest',
  'user-agent': USER_AGENT,
  'referer': 'https://tvprofil.com/tvprogram/',
  'accept':
    'text/javascript, application/javascript, application/ecmascript, application/x-ecmascript, */*; q=0.01'
}

// The site signs every program request with a per-page-load nonce ("bi") that is tied to a
// session cookie. Without a matching cookie + signature the endpoint returns a microtime nonce
// or `{code:403,"Session expired"}` instead of program data. So we load the country's program
// page once, read `bi` and the session cookie, cache it, and reuse it for all of that country's
// channels. The session is refreshed when it gets stale or after a failed (empty) response.
const sessions = new Map()
const SESSION_TTL = 90 * 1000

// The site rate-limits aggressively (serves a tiny interstitial instead of the page). When we
// hit that, back off globally so the remaining channels fail fast instead of each hammering the
// page and prolonging the block.
let throttledUntil = 0
const THROTTLE_BACKOFF = 60 * 1000

module.exports = {
  site: 'tvprofil.com',
  days: 2,
  async url({ channel, date }) {
    const [progsPath, kanal] = channel.site_id.split('#')
    const session = await ensureSession(progsPath)
    const query = buildQuery(date.format('YYYY-MM-DD'), kanal, channel.lang, session.bi)

    return `https://tvprofil.com/${progsPath}/program/?${query}`
  },
  request: {
    async headers({ channel }) {
      const [progsPath] = channel.site_id.split('#')
      const session = await ensureSession(progsPath)

      return { ...HEADERS, cookie: session.cookie }
    }
  },
  parser: function ({ content, channel }) {
    let programs = []
    const items = parseItems(content)

    // An empty result here means the response was not valid program data (expired session,
    // rate-limit, microtime nonce, ...). Drop the cached session so the next request re-handshakes.
    if (items.length === 0 && channel) {
      const [progsPath] = channel.site_id.split('#')
      sessions.delete(progsPath)
    }

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
            'user-agent': USER_AGENT,
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

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms))
}

// Load a country's program page to obtain its session cookie and the current `bi` nonce.
// Retries past the site's rate-limit interstitial. Results are cached per country.
async function ensureSession(progsPath) {
  const cached = sessions.get(progsPath)
  if (cached && Date.now() - cached.ts < SESSION_TTL) return cached

  if (Date.now() < throttledUntil) {
    throw new Error('tvprofil.com: backing off after rate-limit')
  }

  const pageUrl = `https://tvprofil.com/${progsPath}/`
  let cookie = ''

  for (let attempt = 1; attempt <= 5; attempt++) {
    const res = await axios
      .get(pageUrl, {
        headers: { 'user-agent': USER_AGENT, 'referer': 'https://tvprofil.com/', cookie },
        validateStatus: () => true
      })
      .catch(() => null)

    if (res) {
      const setCookie = res.headers && res.headers['set-cookie']
      if (setCookie && setCookie.length) cookie = mergeCookies(cookie, setCookie)

      const match = String(res.data).match(/"bi":(\d+)/)
      if (match) {
        const session = { cookie, bi: parseInt(match[1]), ts: Date.now() }
        sessions.set(progsPath, session)

        return session
      }
    }

    if (attempt < 5) await sleep(1500)
  }

  throttledUntil = Date.now() + THROTTLE_BACKOFF
  throw new Error(`tvprofil.com: could not establish a session for "${progsPath}" (rate-limited)`)
}

function mergeCookies(existing, setCookie) {
  const jar = {}
  if (existing) {
    existing.split('; ').forEach(pair => {
      const i = pair.indexOf('=')
      if (i > -1) jar[pair.slice(0, i)] = pair.slice(i + 1)
    })
  }
  setCookie.forEach(cookie => {
    const pair = cookie.split(';')[0]
    const i = pair.indexOf('=')
    if (i > -1) jar[pair.slice(0, i)] = pair.slice(i + 1)
  })

  return Object.entries(jar)
    .map(([key, value]) => `${key}=${value}`)
    .join('; ')
}

// Port of the site's current request-signing function (`bazinga`), inlined in the program page.
function buildQuery(datum, kanal, lang, bi) {
  const { key, b } = sign(datum, kanal, bi)

  const query = { datum, kanal }
  query['callback'] = `sport${lang || ''}${b}`
  query[key] = b

  return new URLSearchParams(query).toString()
}

function sign(datum, kanal, bi) {
  let b = 2
  let c = 5
  const a = datum + kanal + c
  let i = a.length
  const ua = kanal + datum || 'none'

  for (let j = 0; j < ua.length; j++) c += ua.charCodeAt(j)
  while (i--) b += (a.charCodeAt(i) + c * 2 + bi) * i

  b = b.toString()
  const key = 'b' + b.charCodeAt(b.length - 1)

  return { key, b }
}
