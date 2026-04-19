const dayjs = require('dayjs')
const utc = require('dayjs/plugin/utc')
const doFetch = require('@ntlab/sfetch')
const uniqBy = require('lodash.uniqby')

dayjs.extend(utc)

module.exports = {
  site: 'ziggogo.tv',
  days: 2,
  request: {
    cache: {
      ttl: 24 * 60 * 60 * 1000 // 1 day
    }
  },
  url({ date, segment = 0 }) {
    return `https://static.spark.ziggogo.tv/eng/web/epg-service-lite/nl/en/events/segments/${date.format(
      'YYYYMMDD'
    )}${segment.toString().padStart(2, '0')}0000`
  },
  async parser({ content, channel, date }) {
    const programs = []
    if (!content) return []
    const parsed = typeof content === 'string' ? JSON.parse(content) : content
    if (!Array.isArray(parsed.entries)) return []
    const entries = parsed.entries

    // fetch other segments
    let segments = [
      module.exports.url({ date, segment: 6 }),
      module.exports.url({ date, segment: 12 }),
      module.exports.url({ date, segment: 18 })
    ]
    await doFetch(segments, (url, res) => {
      if (Array.isArray(res.entries)) {
        entries.push(...res.entries)
      }
    })

    let events = []
    entries
      .filter(item => item.channelId === channel.site_id)
      .forEach(item => {
        if (!Array.isArray(item.events)) return
        events.push(
          ...item.events.map(event => ({
            startTime: event.startTime,
            url: `https://spark-prod-nl.gnp.cloud.ziggogo.tv/eng/web/linear-service/v2/replayEvent/${event.id}?returnLinearContent=true&forceLinearResponse=true&language=nl`
          }))
        )
      })

    events = uniqBy(events, 'startTime')

    // fetch detailed guide
    if (events.length) {
      await doFetch(events, (url, res) => {
        programs.push({
          title: res.title,
          subTitle: res.episodeName,
          description: res.longDescription ? res.longDescription : res.shortDescription,
          category: res.genres,
          season: res.seasonNumber,
          episode: res.episodeNumber,
          country: res.countryOfOrigin,
          actor: res.actors,
          director: res.directors,
          producer: res.producers,
          date: res.productionDate,
          start: dayjs.utc(res.startTime * 1000),
          stop: dayjs.utc(res.endTime * 1000)
        })
      })
    }

    return programs
  },
  async channels() {
    const channels = []
    const axios = require('axios')
    const res = await axios
      .get(
        'https://spark-prod-nl.gnp.cloud.ziggogo.tv/eng/web/linear-service/v2/channels?cityId=65535&language=en&productClass=Orion-DASH&platform=web'
      )
      .then(r => r.data)
      .catch(console.error)

    if (Array.isArray(res)) {
      channels.push(
        ...res
          .filter(item => !item.isHidden)
          .map(item => {
            return {
              lang: 'nl',
              site_id: item.id,
              name: item.name
            }
          })
      )
    }

    return channels
  }
}
