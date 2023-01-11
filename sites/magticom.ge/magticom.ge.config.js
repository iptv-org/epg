const cheerio = require('cheerio')
const axios = require('axios')
const dayjs = require('dayjs')
const utc = require('dayjs/plugin/utc')
const timezone = require('dayjs/plugin/timezone')
const customParseFormat = require('dayjs/plugin/customParseFormat')

dayjs.extend(utc)
dayjs.extend(timezone)
dayjs.extend(customParseFormat)

module.exports = {
  site: 'magticom.ge',
  days: 2,
  url: 'https://www.magticom.ge/request/channel-program.php',
  request: {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
      Referer: 'https://www.magticom.ge/en/tv/tv-services/tv-guide'
    },
    data({ channel, date }) {
      const params = new URLSearchParams()
      params.append('channelId', channel.site_id)
      params.append('start', date.unix())
      params.append('end', date.add(1, 'd').unix())

      return params
    }
  },
  parser({ content }) {
    let programs = []
    const items = parseItems(content)
    items.forEach(item => {
      programs.push({
        title: item.title,
        description: item.info,
        start: parseStart(item),
        stop: parseStop(item)
      })
    })

    return programs
  },
  async channels({ country, lang }) {
    const html = await axios
      .get(`https://www.magticom.ge/en/tv/tv-services/tv-guide`)
      .then(r => r.data)
      .catch(console.log)

    const $ = cheerio.load(html)
    const channels = $(
      '#article > article > div > div > div.tv-guide > div.tv-guide-channels > div.tv-guide-channel'
    ).toArray()

    return channels.map(item => {
      const $item = cheerio.load(item)
      const channelId = $item('*').data('id')
      return {
        lang: 'ka',
        site_id: channelId,
        name: $item('.tv-guide-channel-title > div > div').text()
      }
    })
  }
}

function parseStart(item) {
  return dayjs.tz(item.startTimestamp, 'YYYY-MM-DDTHH:mm:ss', 'Asia/Tbilisi')
}

function parseStop(item) {
  return dayjs.tz(item.endTimestamp, 'YYYY-MM-DDTHH:mm:ss', 'Asia/Tbilisi')
}

function parseItems(content) {
  let data
  try {
    data = JSON.parse(content)
  } catch (err) {}
  if (!data || !Array.isArray(data)) return []

  return data
}
