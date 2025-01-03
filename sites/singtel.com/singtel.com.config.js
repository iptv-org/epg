const dayjs = require('dayjs')
const utc = require('dayjs/plugin/utc')
const timezone = require('dayjs/plugin/timezone')

dayjs.extend(utc)
dayjs.extend(timezone)

module.exports = {
  site: 'singtel.com',
  days: 3,
  request: {
    cache: {
      ttl: 60 * 60 * 1000 // 1 hour
    }
  },
  url({ date }) {
    return `https://www.singtel.com/etc/singtel/public/tv/epg-parsed-data/${date.format(
      'DDMMYYYY'
    )}.json`
  },
  parser({ content, channel }) {
    let programs = []
    const items = parseItems(content, channel)
    items.forEach(item => {
      const start = dayjs.tz(item.startDateTime, 'Asia/Singapore')
      const stop = start.add(item.duration, 's')
      programs.push({
        title: item.program.title,
        category: item.program.subCategory,
        description: item.program.description,
        start,
        stop
      })
    })

    return programs
  },
  async channels() {
    const axios = require('axios')
    const cheerio = require('cheerio')

    const data = await axios
      .get('https://www.singtel.com/personal/products-services/tv/tv-programme-guide')
      .then(r => r.data)
      .catch(console.log)

    const $ = cheerio.load(data)
    let datamodel = $('ux-tv-channel-epg').attr('datamodel')
    datamodel = JSON.parse(datamodel)

    return datamodel.tvChannelLists.map(item => {
      return {
        lang: 'en',
        site_id: item.epgChannelId,
        name: item.title.trim()
      }
    })
  }
}

function parseItems(content, channel) {
  try {
    const data = JSON.parse(content)
    return data && data[channel.site_id] ? data[channel.site_id] : []
  } catch {
    return []
  }
}
