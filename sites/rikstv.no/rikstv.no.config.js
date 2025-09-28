const dayjs = require('dayjs')
const utc = require('dayjs/plugin/utc')
const axios = require('axios')

dayjs.extend(utc)

module.exports = {
  site: 'rikstv.no',
  days: 3,
  request: {
    cache: {
      ttl: 60 * 60 * 1000 // 1 hour
    }
  },
  url({ channel, date }) {
    return `https://play.rikstv.no/api/content-search/1/channel/${
      channel.site_id
    }/epg/${date.format('YYYY-MM-DD')}`
  },
  parser: function ({ content }) {
    let data
    try {
      data = JSON.parse(content)
    } catch (error) {
      console.error('Error parsing JSON:', error)
      return []
    }

    const programs = []

    if (data && Array.isArray(data)) {
      data.forEach(item => {
        if (!item) return
        //const start = dayjs.utc(item.broadcastedTime)
        //const stop = dayjs.utc(item.broadcastedTimeEnd)

        programs.push({
          title: item.seriesName,
          sub_title: item.name,
          description: item.description || item.synopsis,
          season: item.season || null,
          episode: item.episode || null,
          category: item.genres,
          actors: item.actors,
          directors: item.director || item.directors,
          icon: item.imagePackUri,
          start: item.broadcastedTime,
          stop: item.broadcastedTimeEnd
        })
      })
    }

    return programs
  },
  async channels() {
    try {
      const response = await axios.get(
        'https://play.rikstv.no/api/content-search/1/channel?includePrograms=false'
      )
      if (!response.data || !Array.isArray(response.data)) {
        console.error('Error: No channels data found')
        return []
      }
      return response.data.map(item => {
        return {
          lang: 'no',
          site_id: item.channelId,
          name: item.serviceName
        }
      })
    } catch (error) {
      console.error('Error fetching channels:', error)
      return []
    }
  }
}
