const dayjs = require('dayjs')
const utc = require('dayjs/plugin/utc')
const axios = require('axios')

dayjs.extend(utc)

module.exports = {
  site: 'syn.is',
  days: 7,
  request: {
    cache: {
      ttl: 60 * 60 * 1000 // 1 hour
    }
  },
  url({ channel, date }) {
    return `https://www.syn.is/api/epg/${channel.site_id}/${date.format('YYYY-MM-DD')}`
  },
  parser: function ({ content, date }) {
      let data
      try {
        data = JSON.parse(content)
      } catch (error) {
        console.error('Error parsing JSON:', error)
        return []
      }

      if (!Array.isArray(data)) return []

      const programs = []

      data
        .filter(item => item?.upphaf)
        .forEach(item => {
          const start = dayjs.utc(item.upphaf)

          if (start.format('YYYY-MM-DD') === date.format('YYYY-MM-DD')) {
            programs.push({
              title: item.isltitill,
              sub_title: item.undirtitill,
              description: item.lysing,
              category: item.flokkur,
              season: item.seria,
              episode: item.thattur,
              actors: item.adalhlutverk,
              directors: item.leikstjori,
              start,
              stop: start.add(item.slott, 'm')
            })
          }
        })

      return programs
    },
  async channels() {
    try {
      const response = await axios.get('https://www.syn.is/api/epg?type=schedule')
      if (!response.data || !Array.isArray(response.data)) {
        console.error('Error: No channels data found')
        return []
      }

      const channels = await Promise.all(
        response.data.map(async item => {
          try {
            const { data: channelData } = await axios.get(`https://www.syn.is/api/epg/${item}`)
            if (!channelData?.[0]?.midill_heiti) {
              console.error(`Error: No name found for channel ${item}`)
              return null
            }
            return {
              lang: 'is',
              site_id: item,
              name: channelData[0].midill_heiti
            }
          } catch (error) {
            console.error(`Error fetching channel name for ${item}:`, error)
            return null
          }
        })
      )

      return channels.filter(Boolean)
    } catch (error) {
      console.error('Error fetching channels:', error)
      return []
    }
  }
}
