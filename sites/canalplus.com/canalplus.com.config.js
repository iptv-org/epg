const dayjs = require('dayjs')
const axios = require('axios')
const utc = require('dayjs/plugin/utc')

dayjs.extend(utc)

const paths = {
    ad: 'cpfra/ad',
    au: 'cpncl/au',
    bf: 'cpafr/bf',
    bi: 'cpafr/bi',
    bj: 'cpafr/bj',
    bl: 'cpant/bl',
    cd: 'cpafr/cd',
    cf: 'cpafr/cf',
    cg: 'cpafr/cg',
    ch: 'cpche',
    ch_de: 'cpchd',
    ci: 'cpafr/ci',
    cm: 'cpafr/cm',
    cv: 'cpafr/cv',
    dj: 'cpafr/dj',
    et: 'cpeth/et',
    fr: 'cpfra',
    ga: 'cpafr/ga',
    gf: 'cpant/gf',
    gh: 'cpafr/gh',
    gm: 'cpafr/gm',
    gn: 'cpafr/gn',
    gp: 'cpafr/gp',
    gw: 'cpafr/gw',
    ht: 'cpant/ht',
    km: 'cpafr/km',
    mc: 'cpfra/mc',
    mf: 'cpant/mf',
    mg: 'cpmdg/mg',
    ml: 'cpafr/ml',
    mq: 'cpant/mq',
    mr: 'cpafr/mr',
    mu: 'cpmus/mu',
    nc: 'cpncl/nc',
    ne: 'cpafr/ne',
    pf: 'cppyf/pf',
    pl: 'cppol',
    re: 'cpreu/re',
    rw: 'cpafr/rw',
    sl: 'cpafr/sl',
    sn: 'cpafr/sn',
    td: 'cpafr/td',
    tg: 'cpafr/tg',
    wf: 'cpncl/wf',
    yt: 'cpreu/yt',
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

let canalToken = {}

module.exports = {
  site: 'canalplus.com',
  days: 2,
  url: async function ({ channel, date }) {
    const [region, site_id] = channel.site_id.split('#')
    if(!canalToken[region]) canalToken[region] = await parseToken(region || 'fr')
    const path = region === 'pl' ? 'mycanalint' : 'mycanal'
    const diff = date.diff(dayjs.utc().startOf('d'), 'd')

    return `https://hodor.canalplus.pro/api/v2/${path}/channels/${canalToken[region].token}/${site_id}/broadcasts/day/${diff}`
  },
  request:{
    headers() {
      return globalHeaders
    }
  },
  async parser({ content }) {
    let programs = []
    const items = parseItems(content)
    for (let item of items) {
      const prev = programs[programs.length - 1]
      const details = await loadProgramDetails(item)
      const info = parseInfo(details)
      const start = parseStart(item)
      if (prev) prev.stop = start
      const stop = start.add(1, 'h')
      programs.push({
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
        stop
      })
    }

    return programs
  },
  async channels({ country }) {

    let channels = []
    const path = paths[country]
    const url = `https://secure-webtv-static.canal-plus.com/metadata/${path}/all/v2.2/globalchannels.json`
    const data = await axios
      .get(url)
      .then(r => r.data)
      .catch(console.log)

    data.channels.forEach(channel => {
      const site_id = country === 'fr' ? `#${channel.id}` : `${country}#${channel.id}`

      if (channel.name === '.') return

      channels.push({
        lang: 'fr',
        site_id,
        name: channel.name
      })
    })

    return channels
  }
}

async function parseToken(country) {
  // for France, query hodor w/ path mycanal
  // for Poland, query hodor w/ path mycanalint
  let url
  if (country !== 'fr' && country !== 'pl') {
    // Should work for overseas territories
    const path = paths[country]
    const offerZone = path.split('/')[0]
    const offerLocation = path.split('/')[1]
    const data = await axios.get(`https://hodor.canalplus.pro/api/v2/mycanal/authenticate.json/webapp/6.0?experiments=beta-test-one-tv-guide:control&offerZone=${offerZone}&offerLocation=${offerLocation}`, { headers: globalHeaders }
    ).then(r => r.data).catch(console.error)
    return { country: country, token: data.token }
  }
  switch(country) {
    // Canal + France
    case 'fr':
      url = 'https://hodor.canalplus.pro/api/v2/mycanal/authenticate.json/webapp/6.0?experiments=beta-test-one-tv-guide:control'
      break
    // Canal + International (Poland)
    case 'pl':
      url = 'https://hodor.canalplus.pro/api/v2/mycanalint/authenticate.json/webapp/6.0?experiments=beta-test-one-tv-guide:control'
      break
  }
  const tokenData = await axios.get(
    `${url}`,
    {
      headers: globalHeaders,
      timeout: 5000
    }).then(r => r.data).catch(console.error)

  canalToken = { country: country, token: tokenData.token }
  return tokenData.token
}

function parseStart(item) {
  return item && item.startTime ? dayjs(item.startTime) : null
}

function parseImage(info) {
  return info ? info.URLImage : null
}

function parseDescription(info) {
  return info ? info.summary : null
}

function parseInfo(data) {
  if (!data || !data.detail || !data.detail.informations) return null

  return data.detail.informations
}

async function loadProgramDetails(item) {
  if (!item.onClick || !item.onClick.URLPage) return {}

  return await axios
    .get(item.onClick.URLPage, { headers: globalHeaders })
    .then(r => r.data)
    .catch(console.error)
}

function parseItems(content) {
  const data = JSON.parse(content)
  if (!data || !Array.isArray(data.timeSlices)) return []

  return data.timeSlices.reduce((acc, curr) => {
    acc = acc.concat(curr.contents)
    return acc
  }, [])
}

function parseCast(info, type) {
  let people = []
  if (info && info.personnalities) {
    const personnalities = info.personnalities.find(i => i.prefix == type)
    if (!personnalities) return people
    for (let person of personnalities.personnalitiesList) {
      people.push(person.title)
    }
  }
  return people
}

function parseDate(info) {
  return info && info.productionYear ? info.productionYear : null
}

function parseRating(info) {
  if (!info || !info.parentalRatings) return null
  let rating = info.parentalRatings.find(i => i.authority === 'CSA')
  if (!rating || Array.isArray(rating)) return null
  if (rating.value === '1') return null
  if (rating.value === '2') rating.value = '-10'
  if (rating.value === '3') rating.value = '-12'
  if (rating.value === '4') rating.value = '-16'
  if (rating.value === '5') rating.value = '-18'
  return {
    system: rating.authority,
    value: rating.value
  }
}
