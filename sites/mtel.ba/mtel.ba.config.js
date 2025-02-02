const _ = require('lodash')
const doFetch = require('@ntlab/sfetch')
const dayjs = require('dayjs')
const utc = require('dayjs/plugin/utc')
const timezone = require('dayjs/plugin/timezone')
const customParseFormat = require('dayjs/plugin/customParseFormat')

dayjs.extend(utc)
dayjs.extend(timezone)
dayjs.extend(customParseFormat)

module.exports = {
  site: 'mtel.ba',
  days: 2,
  url({ channel, date }) {
    const [platform] = channel.site_id.split('#')

    return `https://mtel.ba/hybris/ecommerce/b2c/v1/products/channels/epg?platform=tv-${platform}&currentPage=0&pageSize=1000&date=${date.format(
      'YYYY-MM-DD'
    )}`
  },
  request: {
    timeout: 20000, // 20 seconds
    maxContentLength: 10000000, // 10 Mb
    cache: {
      interpretHeader: false,
      ttl: 24 * 60 * 60 * 1000 // 1 day
    }
  },
  parser({ content, channel }) {
    let programs = []
    const items = parseItems(content, channel)
    items.forEach(item => {
      if (item.title === 'Nema informacija o programu') return
      programs.push({
        title: item.title,
        description: item.description,
        categories: parseCategories(item),
        image: parseImage(item),
        start: parseStart(item),
        stop: parseStop(item)
      })
    })

    return programs
  },
  async channels({ platform = 'msat' }) {
    const platforms = {
      msat: 'https://mtel.ba/hybris/ecommerce/b2c/v1/products/channels/search?pageSize=100&currentPage=<CURRENT_PAGE>&query=:relevantno:tv-kategorija:tv-msat',
      iptv: 'https://mtel.ba/hybris/ecommerce/b2c/v1/products/channels/search?pageSize=100&currentPage=<CURRENT_PAGE>&query=:relevantno:tv-kategorija:tv-iptv:tv-iptv-paket:Svi+kanali'
    }

    const queue = [
      {
        platform,
        url: platforms[platform].replace('<CURRENT_PAGE>', 0)
      }
    ]

    let channels = []
    await doFetch(queue, (req, data) => {
      if (data && data.pagination.currentPage < data.pagination.totalPages) {
        queue.push({
          platform: req.platform,
          url: platforms[req.platform].replace('<CURRENT_PAGE>', ++data.pagination.currentPage)
        })
      }

      data.products.forEach(channel => {
        channels.push({
          lang: 'bs',
          name: channel.name,
          site_id: `${req.platform}#${channel.code}`
        })
      })
    })

    return channels
  }
}

function parseStart(item) {
  return dayjs.tz(item.start, 'YYYY-MM-DD HH:mm', 'Europe/Sarajevo')
}

function parseStop(item) {
  return dayjs.tz(item.end, 'YYYY-MM-DD HH:mm', 'Europe/Sarajevo')
}

function parseCategories(item) {
  return item.category ? item.category.split(' / ') : []
}

function parseImage(item) {
  return item?.picture?.url ? item.picture.url : null
}

function parseItems(content, channel) {
  try {
    const data = JSON.parse(content)
    if (!data || !Array.isArray(data.products)) return []
    const [, channelId] = channel.site_id.split('#')
    const channelData = data.products.find(channel => channel.code === channelId)
    if (!channelData || !Array.isArray(channelData.programs)) return []

    return _.sortBy(channelData.programs, p => parseStart(p).valueOf())
  } catch {
    return []
  }
}
