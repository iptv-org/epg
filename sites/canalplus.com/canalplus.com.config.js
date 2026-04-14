const dayjs = require('dayjs')
const axios = require('axios')
const utc = require('dayjs/plugin/utc')

dayjs.extend(utc)

const paths = {
  ad: { zone: 'cpfra',  location: 'ad' },
  au: { zone: 'cpncl',  location: 'au' },
  bf: { zone: 'cpafr',  location: 'bf' },
  bi: { zone: 'cpafr',  location: 'bi' },
  bj: { zone: 'cpafr',  location: 'bj' },
  bl: { zone: 'cpant',  location: 'bl' },
  cd: { zone: 'cpafr',  location: 'cd' },
  cf: { zone: 'cpafr',  location: 'cf' },
  cg: { zone: 'cpafr',  location: 'cg' },
  ch: { zone: 'cpche',  location: null },
  ch_de: { zone: 'cpchd', location: null },
  ci: { zone: 'cpafr',  location: 'ci' },
  cm: { zone: 'cpafr',  location: 'cm' },
  cv: { zone: 'cpafr',  location: 'cv' },
  dj: { zone: 'cpafr',  location: 'dj' },
  et: { zone: 'cpeth',  location: 'et' },
  fr: { zone: null,     location: null },
  ga: { zone: 'cpafr',  location: 'ga' },
  gf: { zone: 'cpant',  location: 'gf' },
  gh: { zone: 'cpafr',  location: 'gh' },
  gm: { zone: 'cpafr',  location: 'gm' },
  gn: { zone: 'cpafr',  location: 'gn' },
  gp: { zone: 'cpafr',  location: 'gp' },
  gw: { zone: 'cpafr',  location: 'gw' },
  ht: { zone: 'cpant',  location: 'ht' },
  km: { zone: 'cpafr',  location: 'km' },
  mc: { zone: 'cpfra',  location: 'mc' },
  mf: { zone: 'cpant',  location: 'mf' },
  mg: { zone: 'cpmdg',  location: 'mg' },
  ml: { zone: 'cpafr',  location: 'ml' },
  mq: { zone: 'cpant',  location: 'mq' },
  mr: { zone: 'cpafr',  location: 'mr' },
  mu: { zone: 'cpmus',  location: 'mu' },
  nc: { zone: 'cpncl',  location: 'nc' },
  ne: { zone: 'cpafr',  location: 'ne' },
  pf: { zone: 'cppyf',  location: 'pf' },
  pl: { zone: null,     location: null },
  re: { zone: 'cpreu',  location: 're' },
  rw: { zone: 'cpafr',  location: 'rw' },
  sl: { zone: 'cpafr',  location: 'sl' },
  sn: { zone: 'cpafr',  location: 'sn' },
  td: { zone: 'cpafr',  location: 'td' },
  tg: { zone: 'cpafr',  location: 'tg' },
  wf: { zone: 'cpncl',  location: 'wf' },
  yt: { zone: 'cpreu',  location: 'yt' },
}

const globalHeaders = {
  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36',
  'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,/;q=0.8',
  'Accept-Language': 'fr-FR,fr;q=0.6',
  'Accept-Encoding': 'gzip, deflate, br',
  'Pragma': 'no-cache',
  'Priority': 'u=0, i',
  'Sec-CH-UA': '"Not:A-Brand";v="99", "Brave";v="145", "Chromium";v="145"',
  'sec-ch-ua-mobile': '?0',
  'sec-ch-ua-platform': '"Windows"',
  'sec-fetch-dest': 'document',
  'sec-fetch-mode': 'navigate',
  'sec-fetch-site': 'none',
  'sec-fetch-user': '?1',
  'sec-gpc': '1',
  'upgrade-insecure-requests': '1'
}

// Per-region token caching to avoid multiple concurrent calls and redundant token fetches
const tokenCache = {}
const tokenPending = {}

// ARCOM (ex-CSA) internal ratings mapping (https://www.arcom.fr/se-documenter/ressources-pedagogiques/protection-des-mineurs)
// values are negative to be sorted before other ratings if any
const CSA_RATING_MAP = { '2': '-10', '3': '-12', '4': '-16', '5': '-18' }

module.exports = {
  site: 'canalplus.com',
  days: 2,
  url: async function ({ channel, date }) {
    const [region, site_id] = channel.site_id.split('#')
    const currentRegion = region || 'fr'

    if (!tokenCache[currentRegion]) {
      // Prevents concurrent calls from same region
      if (!tokenPending[currentRegion]) {
        tokenPending[currentRegion] = parseToken(currentRegion).then(result => {
          tokenCache[currentRegion] = result
          if (Object.prototype.hasOwnProperty.call(tokenPending, currentRegion)) {
            tokenPending[currentRegion] = undefined
          }
          return result
        })
      }
      await tokenPending[currentRegion]
    }

    const path = currentRegion === 'pl' ? 'mycanalint' : 'mycanal'
    const diff = date.diff(dayjs.utc().startOf('d'), 'd')
    const token = tokenCache[currentRegion]?.token

    return `https://hodor.canalplus.pro/api/v2/${path}/channels/${token}/${site_id}/broadcasts/day/${diff}`
  },
  request: {
    headers() {
      return globalHeaders
    }
  },
  async parser({ content }) {
    const items = parseItems(content)

    // Parallel loading of all program details
    const detailsArray = await Promise.all(items.map(loadProgramDetails))

    const programs = items.map((item, i) => {
      const info = parseInfo(detailsArray[i])
      const start = parseStart(item)
      return {
        title: item.title,
        description: parseDescription(info),
        image: parseImage(info),
        actors: parseCast(info, 'Avec :'),
        director: parseCast(info, 'De :'),
        writer: parseCast(info, 'Scénario :'),
        composer: parseCast(info, 'Musique :'),
        presenter: parseCast(info, 'Présenté par :'),
        date: parseDate(info),
        rating: parseRating(info),
        start,
        stop: null
      }
    })

    // Sort programs by start time and set stop time of each program to the start time of the next one
    for (let i = 0; i < programs.length - 1; i++) {
      programs[i].stop = programs[i + 1].start
    }

    // Last program: fallback +1h if there is no next program
    const last = programs[programs.length - 1]
    if (last && last.start) {
      last.stop = last.start.add(1, 'h')
    }

    return programs
  },
  async channels({ country }) {
    const { zone, location } = paths[country] || {}
    const pathSegment = location ? `${zone}/${location}` : zone || country
    const url = `https://secure-webtv-static.canal-plus.com/metadata/${pathSegment}/all/v2.2/globalchannels.json`

    const data = await axios
      .get(url)
      .then(r => r.data)
      .catch(console.log)

    return data.channels
      .filter(channel => channel.name !== '.')
      .map(channel => ({
        lang: 'fr',
        site_id: country === 'fr' ? `#${channel.id}` : `${country}#${channel.id}`,
        name: channel.name
      }))
  }
}

async function parseToken(country) {
  const { zone, location } = paths[country] || {}

  let url
  if (country === 'fr') {
    url = 'https://hodor.canalplus.pro/api/v2/mycanal/authenticate.json/webapp/6.0?experiments=beta-test-one-tv-guide:control'
  } else if (country === 'pl') {
    url = 'https://hodor.canalplus.pro/api/v2/mycanalint/authenticate.json/webapp/6.0?experiments=beta-test-one-tv-guide:control'
  } else {
    url = `https://hodor.canalplus.pro/api/v2/mycanal/authenticate.json/webapp/6.0?experiments=beta-test-one-tv-guide:control&offerZone=${zone}&offerLocation=${location}`
  }

  const data = await axios
    .get(url, { headers: globalHeaders, timeout: 5000 })
    .then(r => r.data)
    .catch(console.error)

  return { country, token: data?.token }
}

function parseStart(item) {
  return item?.startTime ? dayjs(item.startTime) : null
}

function parseImage(info) {
  return info?.URLImage ?? null
}

function parseDescription(info) {
  return info?.summary ?? null
}

function parseInfo(data) {
  return data?.detail?.informations ?? null
}

async function loadProgramDetails(item) {
  if (!item?.onClick?.URLPage) return {}
  return axios
    .get(item.onClick.URLPage, { headers: globalHeaders })
    .then(r => r.data)
    .catch(console.error)
}

function parseItems(content) {
  const data = JSON.parse(content)
  if (!data || !Array.isArray(data.timeSlices)) return []
  return data.timeSlices.flatMap(s => s.contents)
}

function parseCast(info, type) {
  if (!info?.personnalities) return []
  const group = info.personnalities.find(i => i.prefix === type)
  if (!group) return []
  return group.personnalitiesList.map(p => p.title)
}

function parseDate(info) {
  return info?.productionYear ?? null
}

function parseRating(info) {
  if (!info?.parentalRatings) return null
  const rating = info.parentalRatings.find(i => i.authority === 'CSA')
  if (!rating || Array.isArray(rating) || rating.value === '1') return null
  return {
    system: rating.authority,
    value: CSA_RATING_MAP[rating.value] ?? rating.value
  }
}
