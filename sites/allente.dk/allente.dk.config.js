const dayjs = require('dayjs')

const eventIds = []

module.exports = {
  site: 'allente.dk',
  days: 2,
  request: {
    cache: {
      ttl: 24 * 60 * 60 * 1000 // 1 day
    }
  },
  url({ date }) {
    return `https://www.allente.dk/api/epg/refetch-epg-data?Start=${date.format('YYYY-MM-DD')}`
  },
  parser({ content, channel }) {
    const programs = []
    if (typeof content === 'string' || Buffer.isBuffer(content)) {
      content = JSON.parse(content)
    }
    if (Array.isArray(content?.channels)) {
      content.channels
        .filter(item => item.id === channel.site_id)
        .forEach(item => {
          if (Array.isArray(item.programs)) {
            item.programs
              // make program unique across days
              .filter(event => !eventIds.includes(event.id))
              .forEach(event => {
                eventIds.push(event.id)
                programs.push({
                  title: event.title,
                  description: event.shortDescription,
                  category: event.genres,
                  image: event.splashImageUri,
                  season: event.seasonNumber ? event.seasonNumber : null,
                  episode: event.episodeNumber ? event.episodeNumber : null,
                  year: event.releaseYear ? event.releaseYear.toString() : null,
                  start: dayjs(event.eventStart),
                  stop: dayjs(event.eventEnd)
                })
              })
          }
        })
    }

    return programs
  },
  async channels() {
    const channels = []
    const axios = require('axios')
    const res = await axios.get(`https://www.allente.dk/api/epg/refetch-epg-data?Start=${dayjs().format('YYYY-MM-DD')}`)
      .then(res => res.data)
      .catch(console.error)

    if (Array.isArray(res.channels)) {
      channels.push(...res.channels
        .map(item => ({
            lang: 'da',
            site_id: item.id,
            name: item.name
          })
        ))
    }

    return channels
  }
}
