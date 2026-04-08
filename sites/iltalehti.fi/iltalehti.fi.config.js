const axios = require('axios')
const dayjs = require('dayjs')
const utc = require('dayjs/plugin/utc')
const timezone = require('dayjs/plugin/timezone')
const customParseFormat = require('dayjs/plugin/customParseFormat')

dayjs.extend(utc)
dayjs.extend(timezone)
dayjs.extend(customParseFormat)

dayjs.tz.setDefault('Europe/Helsinki')

module.exports = {
  site: 'iltalehti.fi',
  days: 2,
  request: {
    cache: {
      ttl: 60 * 60 * 1000 // 1 hour
    }
  },
  url: function ({ channel, date }) {
    const [group] = channel.site_id.split('#')
    const start = encodeURIComponent(date.format('YYYY-MM-DDTHH:mm:ssZ'))
    const end = encodeURIComponent(date.add(1, 'day').format('YYYY-MM-DDTHH:mm:ssZ'))
    return `https://il-telkku-api.prod.il.fi/v1/channel-groups/${group}/offering?startTime=${start}&endTime=${end}`
  },
  parser: function ({ content, channel }) {
    let programs = []
    const items = getItems(content, channel)
    items.forEach(item => {
      programs.push({
        title: item.programName,
        description: item.description,
        episode: item.episodeNumber || null,
        season: item.seasonNumber || null,
        image: getImage(item),
        start: getStart(item),
        stop: getStop(item)
      })
    })

    return programs
  },
  async channels() {
    const data = await axios
      .get('https://il-telkku-api.prod.il.fi/v1/channel-groups')
      .then(r => r.data)
      .catch(console.log)

    let items = []
    data.response.forEach(group => {
      group.channels.forEach(channel => {
        items.push({
          lang: 'fi',
          site_id: `${group.id}#${channel.id}`,
          name: channel.name
        })
      })
    })

    return items
  }
}

function getImage(item) {
  const image = item.images.find(i => i.sizeTag === '612x382')

  return image ? image.url : null
}

function getStart(item) {
  return dayjs(item.startTime)
}

function getStop(item) {
  return dayjs(item.endTime)
}

function getItems(content, channel) {
  const [, channelId] = channel.site_id.split('#')
  const data = JSON.parse(content)
  
  if (!data || !Array.isArray(data.response)) return []

  const responseData = data.response
  
  let channelData = null
  for (const item of responseData) {
    if (item.channelId === channelId) {
      channelData = item
      break
    }
  }
  if (!channelData || !channelData.programs || typeof channelData.programs !== 'object') return []
  
  const programs = []
  Object.values(channelData.programs).forEach(timeSlot => {
    if (Array.isArray(timeSlot)) {
      programs.push(...timeSlot)
    }
  })
  
  return programs
}
