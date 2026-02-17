const axios = require('axios')
const dayjs = require('dayjs')
const cheerio = require('cheerio')

module.exports = {
  site: 'foxtel.com.au',
  days: 2,
  url({ channel, date }) {
    return `https://www.foxtel.com.au/tv-guide/channel/${channel.site_id}/${date.format(
      'YYYY/MM/DD'
    )}`
  },
  request: {
    headers: {
      'Accept-Language': 'en-US,en;',
      Cookie: 'AAMC_foxtel_0=REGION|7',
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
    }
  },
  parser: function ({ content, date }) {
    let programs = []
    const items = parseItems(content)
    for (let item of items) {
      const $item = cheerio.load(item)
      const prev = programs[programs.length - 1]
      let start = parseStart($item)
      if (prev) {
        if (start.isBefore(prev.start)) {
          start = start.add(1, 'd')
          date = date.add(1, 'd')
        }
        prev.stop = start
      }
      const stop = start.add(30, 'm')
      programs.push({
        title: parseTitle($item),
        sub_title: parseSubTitle($item),
        image: parseImage($item),
        rating: parseRating($item),
        season: parseSeason($item),
        episode: parseEpisode($item),
        start,
        stop
      })
    }

    return programs
  },
  async channels() {
    const data = await axios
      .get('https://www.foxtel.com.au/webepg/ws/foxtel/channels?regionId=8336', {
        headers: {
          'User-Agent': 'insomnia/2022.7.5'
        }
      })
      .then(r => r.data)
      .catch(console.log)

    return data.channels.map(item => {
      const slug = item.name
        .replace(/\+/g, '-')
        .replace(/&/g, '')
        .replace(/[^a-z0-9\s]/gi, '')
        .replace(/\s/g, '-')

      return {
        lang: 'en',
        name: item.name,
        site_id: `${slug}/${item.channelTag}`
      }
    })
  }
}

function parseSeason($item) {
  let seasonString = $item('.epg-event-description > div > abbr:nth-child(1)').attr('title')
  if (!seasonString) return null
  let [, season] = seasonString.match(/^Season: (\d+)/) || [null, null]

  return season ? parseInt(season) : null
}

function parseEpisode($item) {
  let episodeString = $item('.epg-event-description > div > abbr:nth-child(2)').attr('title')
  if (!episodeString) return null
  let [, episode] = episodeString.match(/^Episode: (\d+)/) || [null, null]

  return episode ? parseInt(episode) : null
}

function parseImage($item) {
  return $item('.epg-event-thumbnail > img').attr('src')
}

function parseTitle($item) {
  return $item('.epg-event-description').clone().children().remove().end().text().trim()
}

function parseSubTitle($item) {
  let subtitle = $item('.epg-event-description > div')
    .clone()
    .children()
    .remove()
    .end()
    .text()
    .trim()
    .split(',')

  subtitle = subtitle.pop()
  const [, rating] = subtitle.match(/\(([^)]+)\)$/) || [null, null]

  return subtitle.replace(`(${rating})`, '').trim()
}

function parseRating($item) {
  const subtitle = $item('.epg-event-description > div').text().trim()
  const [, rating] = subtitle.match(/\(([^)]+)\)$/) || [null, null]

  return rating
    ? {
      system: 'ACB',
      value: rating
    }
    : null
}

function parseStart($item) {
  const unix = $item('*').data('scheduled-date')

  return dayjs(parseInt(unix))
}

function parseItems(content) {
  if (!content) return []
  const $ = cheerio.load(content)

  return $('#epg-channel-events > a').toArray()
}
