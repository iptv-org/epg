const dayjs = require('dayjs')
const utc = require('dayjs/plugin/utc')
const doFetch = require('@ntlab/sfetch')
const debug = require('debug')('site:orangetv.orange.es')

dayjs.extend(utc)

doFetch.setDebugger(debug)

const API_PROGRAM_ENDPOINT = 'https://epg.orangetv.orange.es/epg/Smartphone_Android/1_PRO'
const API_CHANNEL_ENDPOINT =
  'https://pc.orangetv.orange.es/pc/api/rtv/v1/GetChannelList?bouquet_id=1&model_external_id=PC&filter_unsupported_channels=false&client=json'
const API_IMAGE_ENDPOINT = 'https://pc.orangetv.orange.es/pc/api/rtv/v1/images'

module.exports = {
  site: 'orangetv.orange.es',
  days: 2,
  request: {
    cache: {
      ttl: 24 * 60 * 60 * 1000 // 1 day
    }
  },
  url({ date, segment = 1 }) {
    return `${API_PROGRAM_ENDPOINT}/${date.format('YYYYMMDD')}_8h_${segment}.json`
  },
  async parser({ content, channel, date }) {
    const programs = []
    const items = parseItems(content, channel)
    if (items.length) {
      const queues = [
        module.exports.url({ date, segment: 2 }),
        module.exports.url({ date, segment: 3 })
      ]
      await doFetch(queues, (url, res) => {
        items.push(...parseItems(res, channel))
      })
      programs.push(
        ...items.map(item => {
          return {
            title: item.name,
            sub_title: item.seriesName,
            description: item.description,
            category: parseGenres(item),
            season: item.seriesSeason ? parseInt(item.seriesSeason) : null,
            episode: item.episodeId ? parseInt(item.episodeId) : null,
            icon: parseIcon(item),
            start: dayjs.utc(item.startDate),
            stop: dayjs.utc(item.endDate)
          }
        })
      )
    }

    return programs
  },
  async channels() {
    const axios = require('axios')
    const data = await axios
      .get(API_CHANNEL_ENDPOINT)
      .then(r => r.data)
      .catch(console.error)

    return data.response.map(item => {
      return {
        lang: 'es',
        name: item.name,
        site_id: item.externalChannelId
      }
    })
  }
}

function parseIcon(item) {
  if (item.attachments.length) {
    const cover = item.attachments.find(i => i.name.match(/cover/i))
    if (cover) {
      return `${API_IMAGE_ENDPOINT}${cover.value}`
    }
  }
}

function parseGenres(item) {
  return item.genres.map(i => i.name)
}

function parseItems(content, channel) {
  const result = []
  const json =
    typeof content === 'string' ? JSON.parse(content) : Array.isArray(content) ? content : []
  if (Array.isArray(json)) {
    json
      .filter(i => i.channelExternalId === channel.site_id)
      .forEach(i => {
        result.push(...i.programs)
      })
  }

  return result
}
