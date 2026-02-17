const dayjs = require('dayjs')
const axios = require('axios')
const parser = require('epg-parser')
const isBetween = require('dayjs/plugin/isBetween')
const customParseFormat = require('dayjs/plugin/customParseFormat')

dayjs.extend(isBetween)
dayjs.extend(customParseFormat)

const API_ENDPOINT = 'https://raw.githubusercontent.com/matthuisman/i.mjh.nz/master'

module.exports = {
  site: 'i.mjh.nz',
  days: 2,
  request: {
    cache: {
      ttl: 3 * 60 * 60 * 1000 // 3h
    },
    maxContentLength: 100 * 1024 * 1024 // 100Mb
  },
  url({ channel }) {
    const [path] = channel.site_id.split('#')

    return `${API_ENDPOINT}/${path}.xml`
  },
  parser({ content, channel, date }) {
    const items = parseItems(content, channel, date)

    const programs = items.map(item => {
      return {
        ...item,
        title: getTitle(item),
        description: getDescription(item),
        categories: getCategories(item),
        icon: getIcon(item)
      }
    })

    return mergeMovieParts(programs)
  },
  async channels({ provider }) {
    const providers = {
      pluto: [
        { path: 'PlutoTV/br', lang: 'pt' },
        { path: 'PlutoTV/ca', lang: 'en' },
        { path: 'PlutoTV/cl', lang: 'es' },
        { path: 'PlutoTV/de', lang: 'de' },
        { path: 'PlutoTV/dk', lang: 'da' },
        { path: 'PlutoTV/es', lang: 'es' },
        { path: 'PlutoTV/fr', lang: 'fr' },
        { path: 'PlutoTV/gb', lang: 'en' },
        { path: 'PlutoTV/it', lang: 'it' },
        { path: 'PlutoTV/mx', lang: 'es' },
        { path: 'PlutoTV/no', lang: 'no' },
        { path: 'PlutoTV/se', lang: 'sv' },
        { path: 'PlutoTV/us', lang: 'en' }
      ],
      plex: [
        { path: 'Plex/au', lang: 'en' },
        { path: 'Plex/ca', lang: 'en' },
        { path: 'Plex/es', lang: 'es' },
        { path: 'Plex/mx', lang: 'es' },
        { path: 'Plex/nz', lang: 'en' },
        { path: 'Plex/us', lang: 'en' }
      ],
      samsung: [
        { path: 'SamsungTVPlus/at', lang: 'de' },
        { path: 'SamsungTVPlus/ca', lang: 'en' },
        { path: 'SamsungTVPlus/ch', lang: 'de' },
        { path: 'SamsungTVPlus/de', lang: 'de' },
        { path: 'SamsungTVPlus/es', lang: 'es' },
        { path: 'SamsungTVPlus/fr', lang: 'fr' },
        { path: 'SamsungTVPlus/gb', lang: 'en' },
        { path: 'SamsungTVPlus/in', lang: 'en' },
        { path: 'SamsungTVPlus/it', lang: 'it' },
        { path: 'SamsungTVPlus/kr', lang: 'ko' },
        { path: 'SamsungTVPlus/us', lang: 'en' }
      ],
      skygo: [{ path: 'SkyGo/epg', lang: 'en' }],
      stirr: [{ path: 'Stirr/all', lang: 'en' }],
      foxtel: [{ path: 'Foxtel/epg', lang: 'en' }],
      binge: [{ path: 'Binge/epg', lang: 'en' }],
      dstv: [{ path: 'DStv/za', lang: 'en' }],
      flash: [{ path: 'Flash/epg', lang: 'en' }],
      kayo: [{ path: 'Kayo/epg', lang: 'en' }],
      metv: [{ path: 'MeTV/epg', lang: 'en' }],
      optus: [{ path: 'Optus/epg', lang: 'en' }],
      pbs: [{ path: 'PBS/all', lang: 'en' }],
      roku: [{ path: 'Roku/epg', lang: 'en' }],
      singtel: [{ path: 'Singtel/epg', lang: 'en' }],
      skysportnow: [{ path: 'SkySportNow/epg', lang: 'en' }],
      au: [
        { path: 'au/Adelaide/epg', lang: 'en' },
        { path: 'au/Brisbane/epg', lang: 'en' },
        { path: 'au/Canberra/epg', lang: 'en' },
        { path: 'au/Darwin/epg', lang: 'en' },
        { path: 'au/Hobart/epg', lang: 'en' },
        { path: 'au/Melbourne/epg', lang: 'en' },
        { path: 'au/Perth/epg', lang: 'en' },
        { path: 'au/Sydney/epg', lang: 'en' }
      ],
      hgtvgo: [{ path: 'hgtv_go/epg', lang: 'en' }],
      nz: [{ path: 'nz/epg', lang: 'en' }]
    }

    const channels = []

    const providerOptions = providers[provider]
    for (const option of providerOptions) {
      const xml = await axios
        .get(`${API_ENDPOINT}/${option.path}.xml`)
        .then(r => r.data)
        .catch(console.error)
      const data = parser.parse(xml)

      data.channels.forEach(item => {
        channels.push({
          lang: option.lang,
          site_id: `${option.path}#${item.id}`,
          name: item.name[0].value
        })
      })
    }

    return channels
  }
}

function mergeMovieParts(programs) {
  const output = []

  programs.forEach(prog => {
    let prev = output[output.length - 1]
    let found =
      prev &&
      prog.categories.includes('Movie') &&
      prev.title === prog.title &&
      prev.description === prog.description

    if (found) {
      prev.stop = prog.stop
    } else {
      output.push(prog)
    }
  })

  return output
}

function getTitle(item) {
  return item.title.length ? item.title[0].value : null
}

function getDescription(item) {
  return item.desc.length ? item.desc[0].value : null
}

function getCategories(item) {
  return item.category.map(c => c.value)
}

function getIcon(item) {
  return item.icon && item.icon.length ? item.icon[0].src : null
}

function parseItems(content, channel, date) {
  try {
    const curr_day = date
    const next_day = date.add(1, 'd')
    const [, site_id] = channel.site_id.split('#')
    const data = parser.parse(content)
    if (!data || !Array.isArray(data.programs)) return []

    return data.programs
      .filter(
        p =>
          p.channel === site_id && dayjs(p.start, 'YYYYMMDDHHmmss ZZ').isBetween(curr_day, next_day)
      )
      .map(p => {
        if (Array.isArray(p.date) && p.date.length) {
          p.date = p.date[0]
        }
        return p
      })
  } catch {
    return []
  }
}
