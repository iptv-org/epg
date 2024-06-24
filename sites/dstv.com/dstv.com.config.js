const axios = require('axios')
const dayjs = require('dayjs')
const utc = require('dayjs/plugin/utc')
const timezone = require('dayjs/plugin/timezone')
const customParseFormat = require('dayjs/plugin/customParseFormat')

dayjs.extend(utc)
dayjs.extend(timezone)
dayjs.extend(customParseFormat)

const API_ENDPOINT = 'https://www.dstv.com/umbraco/api/TvGuide'

module.exports = {
  site: 'dstv.com',
  days: 2,
  request: {
    cache: {
      ttl: 3 * 60 * 60 * 1000, // 3h
      interpretHeader: false
    }
  },
  url: function ({ channel, date }) {
    const [region] = channel.site_id.split('#')
    const packageName = region === 'nga' ? '&package=DStv%20Premium' : ''

    return `${API_ENDPOINT}/GetProgrammes?d=${date.format(
      'YYYY-MM-DD'
    )}${packageName}&country=${region}`
  },
  async parser({ content, channel }) {
    let programs = []
    const items = parseItems(content, channel)
    for (const item of items) {
      const details = await loadProgramDetails(item)
      programs.push({
        title: item.Title,
        description: parseDescription(details),
        icon: parseIcon(details),
        category: parseCategory(details),
        start: parseTime(item.StartTime, channel),
        stop: parseTime(item.EndTime, channel)
      })
    }

    return programs
  },
  async channels({ country }) {
    const countries = {
      ao: 'ago',
      bj: 'ben',
      bw: 'bwa',
      bf: 'bfa',
      bi: 'bdi',
      cm: 'cmr',
      cv: 'cpv',
      td: 'tcd',
      cf: 'caf',
      km: 'com',
      cd: 'cod',
      dj: 'dji',
      gq: 'gnq',
      er: 'eri',
      sz: 'swz',
      et: 'eth',
      ga: 'gab',
      gm: 'gmb',
      gh: 'gha',
      gn: 'gin',
      gw: 'gnb',
      ci: 'civ',
      ke: 'ken',
      lr: 'lbr',
      mg: 'mdg',
      mw: 'mwi',
      ml: 'mli',
      mr: 'mrt',
      mu: 'mus',
      mz: 'moz',
      na: 'nam',
      ne: 'ner',
      ng: 'nga',
      cg: 'cog',
      rw: 'rwa',
      st: 'stp',
      sn: 'sen',
      sc: 'syc',
      sl: 'sle',
      so: 'som',
      za: 'zaf',
      ss: 'ssd',
      sd: 'sdn',
      tz: 'tza',
      tg: 'tgo',
      ug: 'uga',
      zm: 'zmb',
      zw: 'zwe'
    }

    const code = countries[country]

    const data = await axios
      .get(`${API_ENDPOINT}/GetProgrammes?d=${dayjs().format('YYYY-MM-DD')}&country=${code}`)
      .then(r => r.data)
      .catch(console.log)

    let channels = []
    data.Channels.forEach(item => {
      channels.push({
        lang: 'en',
        site_id: `${code}#${item.Number}`,
        name: item.Name
      })
    })

    return [...new Map(channels.map(item => [item.site_id, item])).values()];
  }
}

function parseTime(time, channel) {
  const tz = {
    ago: 'Africa/Luanda',
    ben: 'Africa/Porto-Novo',
    bwa: 'Africa/Gaborone',
    bfa: 'Africa/Ouagadougou',
    bdi: 'Africa/Bujumbura',
    cmr: 'Africa/Douala',
    cpv: 'CVT',
    tcd: 'Africa/Ndjamena',
    caf: 'Africa/Bangui',
    com: 'Indian/Comoro',
    cod: 'Africa/Kinshasa',
    dji: 'Africa/Djibouti',
    gnq: 'Africa/Malabo',
    eri: 'Africa/Asmara',
    swz: 'SAST',
    eth: 'Africa/Addis_Ababa',
    gap: 'Africa/Libreville',
    gmb: 'Africa/Banjul',
    gha: 'Africa/Accra',
    gin: 'Africa/Conakry',
    gnb: 'Africa/Bissau',
    civ: 'Africa/Abidjan',
    ken: 'Africa/Nairobi',
    lbr: 'Africa/Monrovia',
    mdg: 'Indian/Antananarivo',
    mwi: 'Africa/Blantyre',
    mli: 'Africa/Bamako',
    mrt: 'Africa/Nouakchott',
    mus: 'Indian/Mauritius',
    moz: 'Africa/Maputo',
    nam: 'Africa/Windhoek',
    ner: 'Africa/Niamey',
    nga: 'Africa/Lagos',
    cog: 'Africa/Brazzaville',
    rwa: 'Africa/Kigali',
    stp: 'Africa/Sao_Tome',
    sen: 'Africa/Dakar',
    syc: 'Indian/Mahe',
    sle: 'Africa/Freetown',
    som: 'Africa/Mogadishu',
    zaf: 'Africa/Johannesburg',
    ssd: 'Africa/Juba',
    sdn: 'Africa/Khartoum',
    tza: 'Africa/Dar_es_Salaam',
    tgo: 'Africa/Lome',
    uga: 'Africa/Kampala',
    zmb: 'Africa/Lusaka',
    zwe: 'Africa/Harare'
  }
  const [region] = channel.site_id.split('#')

  return dayjs.tz(time, 'YYYY-MM-DDTHH:mm:ss', tz[region])
}

function parseDescription(details) {
  return details ? details.Synopsis : null
}

function parseIcon(details) {
  return details ? details.ThumbnailUri : null
}

function parseCategory(details) {
  return details ? details.SubGenres : null
}

async function loadProgramDetails(item) {
  const url = `${API_ENDPOINT}/GetProgramme?id=${item.Id}`

  return axios
    .get(url)
    .then(r => r.data)
    .catch(console.error)
}

function parseItems(content, channel) {
  const [, channelId] = channel.site_id.split('#')
  const data = JSON.parse(content)
  if (!data || !Array.isArray(data.Channels)) return []
  const channelData = data.Channels.find(c => c.Number === channelId)
  if (!channelData || !Array.isArray(channelData.Programmes)) return []

  return channelData.Programmes
}
