const doFetch = require('@ntlab/sfetch')
const axios = require('axios')
const dayjs = require('dayjs')
const _ = require('lodash')

const cached = {}

module.exports = {
  site: 'mojmaxtv.hrvatskitelekom.hr',
  url({ date }) {
    return `https://tv-hr-prod.yo-digital.com/hr-bifrost/epg/channel/schedules?date=${date.format(
      'YYYY-MM-DD'
    )}&hour_offset=0&hour_range=3&channelMap_id&filler=true&app_language=hr&natco_code=hr`
  },
  request: {
    headers: {
      'app_key': 'GWaBW4RTloLwpUgYVzOiW5zUxFLmoMj5',
      'app_version': '02.0.1080',
      'device-id': 'a78f079d-5527-46d8-af3f-9f0b6b6fb758',
      'tenant': 'tv',
      'user-agent': 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/133.0.0.0 Safari/537.36',
      'origin': 'https://mojmaxtv.hrvatskitelekom.hr',
      'x-request-session-id': 'fc96c9de-7a3b-4b51-8b9d-5d9f9a3c3268',
      'x-request-tracking-id': '05a8f0bc-f977-4754-b8ad-1d4d1bd742fb',
      'x-tv-step': 'EPG_SCHEDULES',
      'x-tv-flow': 'EPG',
      'x-call-type': 'GUEST_USER',
      'x-user-agent': 'web|web|Chrome-133|02.0.1080|1'
    },
    cache: {
      ttl: 24 * 60 * 60 * 1000 // 1 day
    }
  },
  async parser({ content, channel, date }) {
    const data = parseData(content)
    if (!data) return []

    let items = parseItems(data, channel)
    if (!items.length) return []

    const queue = [3, 6, 9, 12, 15, 18, 21]
      .map(offset => {
        const url = module.exports.url({ date }).replace('hour_offset=0', `hour_offset=${offset}`)
        const params = module.exports.request

        if (cached[url]) {
          items = items.concat(parseItems(cached[url], channel))

          return null
        }

        return { url, params }
      })
      .filter(Boolean)

    await doFetch(queue, (_req, _data) => {
      if (_data) {
        cached[_req.url] = _data

        items = items.concat(parseItems(_data, channel))
      }
    })

    items = _.sortBy(items, i => dayjs(i.start_time).valueOf())

    return items.map(item => ({
      title: item.description,
      categories: Array.isArray(item.genres) ? item.genres.map(g => g.name) : [],
      season: item.season_number,
      episode: item.episode_number ? parseInt(item.episode_number) : null,
      date: item['release_year'] ? item['release_year'].toString() : null,
      start: item.start_time,
      stop: item.end_time
    }))
  },
  async channels() {
    const data = await axios
      .get(
        'https://tv-hr-prod.yo-digital.com/hr-bifrost/epg/channel?channelMap_id=&includeVirtualChannels=false&natco_key=l2lyvGVbUm2EKJE96ImQgcc8PKMZWtbE&app_language=hr&natco_code=hr',
        module.exports.request
      )
      .then(r => r.data)
      .catch(console.error)

    return data.channels.map(channel => ({
      lang: 'hr',
      name: channel.title,
      site_id: channel.station_id
    }))
  }
}

function parseData(content) {
  try {
    const data = JSON.parse(content)

    return data || null
  } catch {
    return null
  }
}

function parseItems(data, channel) {
  if (!data.channels || !Array.isArray(data.channels[channel.site_id])) return []

  return data.channels[channel.site_id]
}
