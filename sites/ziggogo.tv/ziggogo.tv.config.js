const dayjs = require('dayjs')
const utc = require('dayjs/plugin/utc')
const doFetch = require('@ntlab/sfetch')

dayjs.extend(utc)
doFetch.setCheckResult(false)

const caches = {}

module.exports = {
  site: 'ziggogo.tv',
  days: 2,
  request: {
    cache: {
      ttl: 24 * 60 * 60 * 1000 // 1 day
    }
  },
  url({ date }) {
    return segmentUrl(date)
  },
  async parser({ content, channel, date }) {
    const programs = []
    if (!content) return []
    const parsed = typeof content === 'string' ? JSON.parse(content) : content
    if (!Array.isArray(parsed.entries)) return []

    const events = []
    const f = entries => {
      entries
        .filter(entry => entry.channelId === channel.site_id)
        .forEach(entry => {
          if (Array.isArray(entry.events)) {
            entry.events.forEach(event => {
              if (!events.find(ev => ev.event.id === event.id)) {
                events.push({
                  url:
                    `https://spark-prod-nl.gnp.cloud.ziggogo.tv/eng/web/linear-service/v2/replayEvent/${event.id}?returnLinearContent=true&forceLinearResponse=true&language=nl`,
                  event
                })
              }
            })
          }
        })
    }
    f(parsed.entries)

    // fetch other segments or use cache if exist
    const segments = []
    for (const segment of [6, 12, 18]) {
      const url = segmentUrl(date, segment)
      if (caches[url] !== undefined) {
        f(caches[url])
      } else {
        segments.push(url)
      }
    }
    if (segments.length) {
      await doFetch(segments, (url, res) => {
        if (Array.isArray(res?.entries)) {
          caches[url] = res.entries
          f(res.entries)
        }
      })
    }

    // fetch detailed guide
    if (events.length) {
      await doFetch(events, (queue, res) => {
        const event = res ? res : queue.event
        programs.push({
          title: event.title,
          subTitle: event.episodeName,
          description: event.longDescription ? event.longDescription : event.shortDescription,
          category: event.genres,
          season: event.seasonNumber,
          episode: event.episodeNumber,
          country: event.countryOfOrigin,
          actor: event.actors,
          director: event.directors,
          producer: event.producers,
          date: event.productionDate,
          start: dayjs.utc(event.startTime * 1000),
          stop: dayjs.utc(event.endTime * 1000)
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

function segmentUrl(date, segment = 0) {
  return `https://staticqbr-prod-nl.gnp.cloud.ziggogo.tv/eng/web/epg-service-lite/nl/en/events/segments/${date.format(
    'YYYYMMDD'
  )}${segment.toString().padStart(2, '0')}0000`
}
