const dayjs = require('dayjs')
const utc = require('dayjs/plugin/utc')
const timezone = require('dayjs/plugin/timezone')
const customParseFormat = require('dayjs/plugin/customParseFormat')

dayjs.extend(utc)
dayjs.extend(timezone)
dayjs.extend(customParseFormat)

module.exports = {
  site: 'shahid.mbc.net',
  days: 2,
  url({ channel, date }) {
    return `https://api2.shahid.net/proxy/v2.1/shahid-epg-api/?csvChannelIds=${
      channel.site_id
    }&from=${date.format('YYYY-MM-DD')}T00:00:00.000Z&to=${date.format(
      'YYYY-MM-DD'
    )}T23:59:59.999Z&country=SA&language=${channel.lang}&Accept-Language=${channel.lang}`
  },
  parser({ content, channel }) {
    const programs = parseItems(content, channel).map(item => {
      return {
        title: item.title,
        description: item.description,
        session: item.seasonNumber,
        episode: item.episodeNumber,
        start: dayjs.tz(item.actualFrom, 'Asia/Riyadh').toISOString(),
        stop: dayjs.tz(item.actualTo, 'Asia/Riyadh').toISOString()
      }
    })

    return programs
  },
  async channels({ lang = 'en' }) {
    const axios = require('axios')
    const items = []
    let page = 0
    while (true) {
      const result = await axios
        .get(
          `https://api2.shahid.net/proxy/v2.1/product/filter?filter=%7B"pageNumber":${page},"pageSize":100,"productType":"LIVESTREAM","productSubType":"LIVE_CHANNEL"%7D&country=SA&language=${lang}&Accept-Language=${lang}`
        )
        .then(response => response.data)
        .catch(console.error)
      if (result.productList) {
        items.push(...result.productList.products)
        if (result.productList.hasMore) {
          page++
          continue
        }
      }
      break
    }
    const channels = items.map(channel => {
      return {
        lang,
        site_id: channel.id,
        name: channel.title
      }
    })

    return channels
  }
}

function parseItems(content, channel) {
  const items = []
  content = content ? JSON.parse(content) : []
  if (content.items) {
    content.items.forEach(schedules => {
      if (schedules.channelId == channel.site_id) {
        items.push(...schedules.items)
        return true
      }
    })
  }

  return items
}
