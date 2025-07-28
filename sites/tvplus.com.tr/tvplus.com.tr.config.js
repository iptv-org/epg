const cheerio = require('cheerio')
const axios = require('axios')
const dayjs = require('dayjs')
const utc = require('dayjs/plugin/utc')
const customParseFormat = require('dayjs/plugin/customParseFormat')
const debug = require('debug')('site:tvplus.com.tr')

dayjs.extend(utc)
dayjs.extend(customParseFormat)

const baseUrl = 'https://tvplus.com.tr/canli-tv/yayin-akisi'

module.exports = {
  site: 'tvplus.com.tr',
  days: 2,
  request: {
    cache: {
      ttl: 24 * 60 * 60 * 1000 // 1 day
    }
  },
  async url({ channel }) {
    if (module.exports.buildId === undefined) {
      module.exports.buildId = await module.exports.fetchBuildId()
      debug('Got build id', module.exports.buildId)
    }
    const channelId = channel.site_id.replace('/', '--')
    return `https://tvplus.com.tr/_next/data/${module.exports.buildId}/${channel.lang}/canli-tv/yayin-akisi/${channelId}.json?title=${channelId}`
  },
  parser({ content, date }) {
    const programs = []
    if (content) {
      const data = JSON.parse(content)
      if (Array.isArray(data?.pageProps?.allPlaybillList)) {
        data.pageProps.allPlaybillList
          .filter(i => i.length && i[0].starttime.startsWith(date.format('YYYY-MM-DD')))
          .forEach(i => {
            for (const schedule of i) {
              const [, season, episode] = schedule.seasonInfo?.match(
                /(\d+)\. Sezon - (\d+)\. Bölüm/
              ) || [null, null, null]
              programs.push({
                title: schedule.name,
                description: schedule.introduce,
                category: schedule.genres,
                image: schedule.picture,
                season: season ? parseInt(season) : null,
                episode: episode ? parseInt(episode) : null,
                start: dayjs.utc(schedule.starttime),
                stop: dayjs.utc(schedule.endtime)
              })
            }
          })
      }
    }

    return programs
  },
  async channels() {
    if (module.exports.buildId === undefined) {
      module.exports.buildId = await module.exports.fetchBuildId()
      debug('Got build id', module.exports.buildId)
    }
    const channels = []
    const data = await axios
      .get(`https://tvplus.com.tr/_next/data/${module.exports.buildId}/canli-tv/yayin-akisi.json`)
      .then(r => r.data)
      .catch(console.error)

    const channels_json = data.pageProps.channelListSsr

    channels_json.forEach(channel => {
      channels.push({
        lang: 'tr',
        name: channel.name,
        site_id: channel.name.normalize('NFD')  // Decompose accented characters
        .replace(/[\u0300-\u036f]/g, '')        // Remove accent marks
        .toLowerCase()
        .replace(/\s+/g, '-')                   // Replace spaces with hyphens
        .replace(/[^a-zA-Z0-9-]/g, '')          // Remove special chars but keep hyphens
        .replace(/^-+|-+$/g, '')                // Remove leading/trailing hyphens
        + '/' + channel.id,
        logo: channel.channelLogo
      })
    })

    return channels
  },
  async fetchBuildId() {
    const data = await axios
      .get(baseUrl)
      .then(r => r.data)
      .catch(console.error)

    if (data) {
      const $ = cheerio.load(data)
      const nextData = JSON.parse($('#__NEXT_DATA__').text())
      return nextData?.buildId || null
    } else {
      return null
    }
  }
}
