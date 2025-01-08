const axios = require('axios')
const dayjs = require('dayjs')

module.exports = {
  site: 'chaines-tv.orange.fr',
  days: 2,
  url({ channel, date }) {
    return `https://rp-ott-mediation-tv.woopic.com/api-gw/live/v3/applications/STB4PC/programs?groupBy=channel&includeEmptyChannels=false&period=${date.valueOf()},${date
      .add(1, 'd')
      .valueOf()}&after=${channel.site_id}&limit=1`
  },
  parser: function ({ content, channel }) {
    let programs = []
    const items = parseItems(content, channel)
    items.forEach(item => {
      const start = parseStart(item)
      const stop = parseStop(item, start)
      programs.push({
        title: item.title,
        subTitle: item.season?.serie?.title,
        category: item.genreDetailed,
        description: item.synopsis,
        season: parseSeason(item),
        episode: parseEpisode(item),
        image: parseImage(item),
        start: start.toJSON(),
        stop: stop.toJSON()
      })
    })

    return programs
  },
  async channels() {
    const html = await axios
      .get('https://chaines-tv.orange.fr/programme-tv?filtres=all')
      .then(r => r.data)
      .catch(console.log)

    const [, nuxtFunc] = html.match(/window\.__NUXT__=([^<]+)/) || [null, null]
    const func = new Function(`"use strict";return ${nuxtFunc}`)

    const data = func()
    const items = data.state.channels.channels

    return items.map(item => {
      return {
        lang: 'fr',
        site_id: item.idEPG,
        name: item.name
      }
    })
  }
}

function parseImage(item) {
  return item.covers && item.covers.length ? item.covers[0].url : null
}

function parseStart(item) {
  return dayjs.unix(item.diffusionDate)
}

function parseStop(item, start) {
  return start.add(item.duration, 's')
}

function parseSeason(item) {
  return item.season?.number
}

function parseEpisode(item) {
  return item.episodeNumber
}

function parseItems(content, channel) {
  const data = JSON.parse(content)

  return data && data[channel.site_id] ? data[channel.site_id] : []
}
