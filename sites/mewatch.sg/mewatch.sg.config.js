const dayjs = require('dayjs')
const utc = require('dayjs/plugin/utc')
const timezone = require('dayjs/plugin/timezone')
const customParseFormat = require('dayjs/plugin/customParseFormat')

dayjs.extend(utc)
dayjs.extend(timezone)
dayjs.extend(customParseFormat)

module.exports = {
  site: 'mewatch.sg',
  days: 2,
  url: function ({ channel, date }) {
    const utcDate = date.isUTC() ? date.tz(dayjs.tz.guess(), true).utc() : date.utc()

    return `https://cdn.mewatch.sg/api/schedules?channels=${channel.site_id}&date=${utcDate.format(
      'YYYY-MM-DD'
    )}&duration=24&ff=idp,ldp,rpt,cd&hour=${utcDate.format(
      'HH'
    )}&intersect=true&lang=en&segments=all`
  },
  parser: function ({ content, channel }) {
    let programs = []
    const items = parseItems(content, channel)
    items.forEach(item => {
      const info = item.item
      
      let title = info.title || ''
      let subTitle = info.episodeTitle || null

      if (subTitle && title.includes(` - ${subTitle}`)) {
        title = title.replace(` - ${subTitle}`, '')
      }

      if (title === subTitle) {
        subTitle = null
      }

      programs.push({
        title,
        subTitle,
        description: info.description || null,
        image: info.images?.tile || null,
        episode: info.episodeNumber || null,
        season: info.seasonNumber || null,
        start: parseStart(item),
        stop: parseStop(item),
        rating: parseRating(info)
      })
    })

    return programs
  },
  async channels() {
    const axios = require('axios')
    const LIST_ID = '239614'
    let channels = []
    let page = 1
    let hasNextPage = true

    while (hasNextPage) {
      const url = `https://cdn.mewatch.sg/api/lists/${LIST_ID}?page=${page}&page_size=100&segments=all`
      
      try {
        const r = await axios.get(url)
        const data = r.data

        if (data && Array.isArray(data.items)) {
          data.items.forEach(item => {
            if (item.type === 'channel' || item.itemType === 'channel') {
              channels.push({
                lang: 'en',
                name: item.title,
                site_id: item.id
              })
            }
          })
        }

        if (data.paging && data.paging.next) {
          page++
        } else {
          hasNextPage = false
        }
      } catch (error) {
        console.error(`Error fetching page ${page}:`, error.message)
        hasNextPage = false
      }
    }

    return channels
  }
}

function parseStart(item) {
  return dayjs(item.startDate)
}

function parseStop(item) {
  return dayjs(item.endDate)
}

function parseRating(info) {
  const classification = info.classification
  if (classification && classification.code) {
    const [, system, value] = classification.code.match(/^([A-Z]+)-([A-Z0-9]+)/) || [
      null,
      null,
      null
    ]

    return { system, value }
  }

  return null
}

function parseItems(content, channel) {
  const data = JSON.parse(content)
  if (!data || !Array.isArray(data)) return []
  const channelData = data.find(i => i.channelId === channel.site_id)

  return channelData && Array.isArray(channelData.schedules) ? channelData.schedules : []
}