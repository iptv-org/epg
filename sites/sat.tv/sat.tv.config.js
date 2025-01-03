const axios = require('axios')
const dayjs = require('dayjs')
const cheerio = require('cheerio')
const utc = require('dayjs/plugin/utc')
const customParseFormat = require('dayjs/plugin/customParseFormat')

dayjs.extend(utc)
dayjs.extend(customParseFormat)

const API_ENDPOINT = 'https://sat.tv/wp-content/themes/twentytwenty-child/ajax_chaines.php'

module.exports = {
  site: 'sat.tv',
  days: 2,
  url: API_ENDPOINT,
  request: {
    method: 'POST',
    headers({ channel }) {
      return {
        'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
        Cookie: `pll_language=${channel.lang}`
      }
    },
    data({ channel, date }) {
      const [satSatellite, satLineup] = channel.site_id.split('#')
      const params = new URLSearchParams()
      params.append('dateFiltre', date.format('YYYY-MM-DD'))
      params.append('hoursFiltre', '0')
      params.append('satLineup', satLineup)
      params.append('satSatellite', satSatellite)
      params.append('userDateTime', date.valueOf())
      params.append('userTimezone', 'Europe/London')

      return params
    },
    cache: {
      ttl: 60 * 60 * 1000 // 1h
    }
  },
  parser: function ({ content, date, channel }) {
    let programs = []
    const items = parseItems(content, channel)
    items.forEach(item => {
      let $item = cheerio.load(item)
      let start = parseStart($item, date)
      let duration = parseDuration($item)
      let stop = start.add(duration, 'm')

      programs.push({
        title: parseTitle($item),
        description: parseDescription($item),
        image: parseImage($item),
        start,
        stop
      })
    })

    return programs
  },
  async channels({ lang }) {
    const satellites = [
      { satellite: 2, lineup: 55 },
      { satellite: 2, lineup: 58 },
      { satellite: 2, lineup: 53 },
      { satellite: 2, lineup: 57 },
      { satellite: 2, lineup: 54 },
      { satellite: 2, lineup: 56 },
      { satellite: 1, lineup: 48 },
      { satellite: 1, lineup: 44 },
      { satellite: 1, lineup: 42 },
      { satellite: 1, lineup: 39 },
      { satellite: 1, lineup: 37 },
      { satellite: 1, lineup: 38 },
      { satellite: 1, lineup: 68 },
      { satellite: 1, lineup: 47 },
      { satellite: 1, lineup: 41 },
      { satellite: 1, lineup: 49 },
      { satellite: 1, lineup: 46 },
      { satellite: 1, lineup: 35 },
      { satellite: 1, lineup: 43 },
      { satellite: 1, lineup: 45 },
      { satellite: 1, lineup: 50 },
      { satellite: 1, lineup: 71 },
      { satellite: 1, lineup: 40 },
      { satellite: 1, lineup: 72 },
      { satellite: 1, lineup: 33 },
      { satellite: 8, lineup: 62 },
      { satellite: 8, lineup: 63 },
      { satellite: 8, lineup: 64 },
      { satellite: 8, lineup: 65 },
      { satellite: 8, lineup: 66 },
      { satellite: 8, lineup: 67 }
    ]

    let channels = []
    for (let sat of satellites) {
      const params = new URLSearchParams()
      params.append('dateFiltre', dayjs().format('YYYY-MM-DD'))
      params.append('hoursFiltre', '0')
      params.append('satLineup', sat.lineup)
      params.append('satSatellite', sat.satellite)
      params.append('userDateTime', dayjs().valueOf())
      params.append('userTimezone', 'Europe/London')
      const data = await axios
        .post(API_ENDPOINT, params, {
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
            Cookie: `pll_language=${lang}`
          }
        })
        .then(r => r.data)
        .catch(console.log)

      const $ = cheerio.load(data)
      $('.main-container-channels-events > .container-channel-events').each((i, el) => {
        const name = $(el).find('.channel-title').text().trim()
        const channelId = name.replace(/\s&\s/gi, ' &amp; ')

        if (!name) return

        channels.push({
          lang,
          site_id: `${sat.satellite}#${sat.lineup}#${channelId}`,
          name
        })
      })
    }

    return channels
  }
}

function parseImage($item) {
  const src = $item('.event-logo img:not(.no-img)').attr('src')

  return src ? `https://sat.tv${src}` : null
}

function parseTitle($item) {
  return $item('.event-data-title').text()
}

function parseDescription($item) {
  return $item('.event-data-desc').text()
}

function parseStart($item, date) {
  let eventDataDate = $item('.event-data-date').text().trim()
  let [, time] = eventDataDate.match(/(\d{2}:\d{2})/) || [null, null]
  if (!time) return null

  return dayjs.utc(`${date.format('YYYY-MM-DD')} ${time}`, 'YYYY-MM-DD HH:mm')
}

function parseDuration($item) {
  let eventDataInfo = $item('.event-data-info').text().trim()
  let [, h, m] = eventDataInfo.match(/(\d{2})h(\d{2})/) || [null, 0, 0]

  return parseInt(h) * 60 + parseInt(m)
}

function parseItems(content, channel) {
  const [, , site_id] = channel.site_id.split('#')
  const $ = cheerio.load(content)
  const channelData = $('.main-container-channels-events > .container-channel-events')
    .filter((index, el) => {
      return $(el).find('.channel-title').text().trim() === site_id
    })
    .first()
  if (!channelData) return []

  return $(channelData).find('.container-event').toArray()
}
