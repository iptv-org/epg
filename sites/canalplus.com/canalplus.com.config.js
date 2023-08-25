const dayjs = require('dayjs')
const axios = require('axios')

module.exports = {
  site: 'canalplus.com',
  days: 2,
  url: async function ({ channel, date }) {
    const [region, site_id] = channel.site_id.split('#')
    const data = await axios
      .get(`https://www.canalplus.com/${region}/programme-tv/`)
      .then(r => r.data.toString())
      .catch(err => console.log(err))
    const token = parseToken(data)

    const diff = date.diff(dayjs.utc().startOf('d'), 'd')

    return `https://hodor.canalplus.pro/api/v2/mycanal/channels/${token}/${site_id}/broadcasts/day/${diff}`
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
        icon: parseIcon(info),
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
  async channels() {
    const endpoints = {
      ad: 'https://secure-webtv-static.canal-plus.com/metadata/cpafr/ad/all/v2.2/globalchannels.json',
      bf: 'https://secure-webtv-static.canal-plus.com/metadata/cpafr/bf/all/v2.2/globalchannels.json',
      bi: 'https://secure-webtv-static.canal-plus.com/metadata/cpafr/bi/all/v2.2/globalchannels.json',
      bj: 'https://secure-webtv-static.canal-plus.com/metadata/cpafr/bj/all/v2.2/globalchannels.json',
      bl: 'https://secure-webtv-static.canal-plus.com/metadata/cpant/bl/all/v2.2/globalchannels.json',
      cd: 'https://secure-webtv-static.canal-plus.com/metadata/cpafr/cd/all/v2.2/globalchannels.json',
      cf: 'https://secure-webtv-static.canal-plus.com/metadata/cpafr/cf/all/v2.2/globalchannels.json',
      cg: 'https://secure-webtv-static.canal-plus.com/metadata/cpafr/cg/all/v2.2/globalchannels.json',
      ch: 'https://secure-webtv-static.canal-plus.com/metadata/cpche/all/v2.2/globalchannels.json',
      ci: 'https://secure-webtv-static.canal-plus.com/metadata/cpafr/ci/all/v2.2/globalchannels.json',
      cm: 'https://secure-webtv-static.canal-plus.com/metadata/cpafr/cm/all/v2.2/globalchannels.json',
      cv: 'https://secure-webtv-static.canal-plus.com/metadata/cpafr/cv/all/v2.2/globalchannels.json',
      dj: 'https://secure-webtv-static.canal-plus.com/metadata/cpafr/dj/all/v2.2/globalchannels.json',
      fr: 'https://secure-webtv-static.canal-plus.com/metadata/cpfra/all/v2.2/globalchannels.json',
      ga: 'https://secure-webtv-static.canal-plus.com/metadata/cpafr/ga/all/v2.2/globalchannels.json',
      gf: 'https://secure-webtv-static.canal-plus.com/metadata/cpant/gf/all/v2.2/globalchannels.json',
      gh: 'https://secure-webtv-static.canal-plus.com/metadata/cpafr/gh/all/v2.2/globalchannels.json',
      gm: 'https://secure-webtv-static.canal-plus.com/metadata/cpafr/gm/all/v2.2/globalchannels.json',
      gn: 'https://secure-webtv-static.canal-plus.com/metadata/cpafr/gn/all/v2.2/globalchannels.json',
      gp: 'https://secure-webtv-static.canal-plus.com/metadata/cpafr/gp/all/v2.2/globalchannels.json',
      gp: 'https://secure-webtv-static.canal-plus.com/metadata/cpant/gp/all/v2.2/globalchannels.json',
      gw: 'https://secure-webtv-static.canal-plus.com/metadata/cpafr/gw/all/v2.2/globalchannels.json',
      mf: 'https://secure-webtv-static.canal-plus.com/metadata/cpant/mf/all/v2.2/globalchannels.json',
      mg: 'https://secure-webtv-static.canal-plus.com/metadata/cpafr/mg/all/v2.2/globalchannels.json',
      ml: 'https://secure-webtv-static.canal-plus.com/metadata/cpafr/ml/all/v2.2/globalchannels.json',
      mq: 'https://secure-webtv-static.canal-plus.com/metadata/cpant/mq/all/v2.2/globalchannels.json',
      mr: 'https://secure-webtv-static.canal-plus.com/metadata/cpafr/mr/all/v2.2/globalchannels.json',
      mu: 'https://secure-webtv-static.canal-plus.com/metadata/cpmus/mu/all/v2.2/globalchannels.json',
      nc: 'https://secure-webtv-static.canal-plus.com/metadata/cpncl/nc/all/v2.2/globalchannels.json',
      ne: 'https://secure-webtv-static.canal-plus.com/metadata/cpafr/ne/all/v2.2/globalchannels.json',
      pl: 'https://secure-webtv-static.canal-plus.com/metadata/cppol/all/v2.2/globalchannels.json',
      re: 'https://secure-webtv-static.canal-plus.com/metadata/cpreu/re/all/v2.2/globalchannels.json',
      rw: 'https://secure-webtv-static.canal-plus.com/metadata/cpafr/rw/all/v2.2/globalchannels.json',
      sl: 'https://secure-webtv-static.canal-plus.com/metadata/cpafr/sl/all/v2.2/globalchannels.json',
      sn: 'https://secure-webtv-static.canal-plus.com/metadata/cpafr/sn/all/v2.2/globalchannels.json',
      td: 'https://secure-webtv-static.canal-plus.com/metadata/cpafr/td/all/v2.2/globalchannels.json',
      tg: 'https://secure-webtv-static.canal-plus.com/metadata/cpafr/tg/all/v2.2/globalchannels.json',
      wf: 'https://secure-webtv-static.canal-plus.com/metadata/cpncl/wf/all/v2.2/globalchannels.json',
      yt: 'https://secure-webtv-static.canal-plus.com/metadata/cpreu/yt/all/v2.2/globalchannels.json'
    }

    let channels = []
    for (let [region, url] of Object.entries(endpoints)) {
      const data = await axios
        .get(url)
        .then(r => r.data)
        .catch(console.log)

      data.channels.forEach(channel => {
        const site_id = region === 'fr' ? `#${channel.id}` : `${region}#${channel.id}`

        if (channel.name === '.') return

        channels.push({
          lang: 'fr',
          site_id,
          name: channel.name
        })
      })
    }

    return channels
  }
}

function parseToken(data) {
  const [, token] = data.match(/"token":"([^"]+)/) || [null, null]

  return token
}

function parseStart(item) {
  return item && item.startTime ? dayjs(item.startTime) : null
}

function parseIcon(info) {
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
    .get(item.onClick.URLPage)
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
