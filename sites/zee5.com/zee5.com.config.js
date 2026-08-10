const axios = require('axios')
const dayjs = require('dayjs')
const utc = require('dayjs/plugin/utc')
const timezone = require('dayjs/plugin/timezone')

dayjs.extend(utc)
dayjs.extend(timezone)

module.exports = {
  site: 'zee5.com',
  days: 2, // max 7 days to the past/future
  request: {
    cache: {
      ttl: 60 * 60 * 1000
    },
    headers: {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36 Edg/142.0.0.0',
	  'Referer': 'https://www.zee5.com/'
    }
  },
  url: function ({ channel, date }) {
    // start=0 (Today), start=1 (Tomorrow)
    const today = dayjs.tz(new Date(), 'Asia/Kolkata').startOf('day')
    const requestedDate = dayjs.tz(date, 'Asia/Kolkata').startOf('day')
    
    const diff = requestedDate.diff(today, 'day')

    return `https://gwapi.zee5.com/v1/epg?channels=${channel.site_id}&start=${diff}&end=${diff}&page_size=500`
  },
      parser: function ({ content }) {
    let programs = []
    
    if (!content) return programs

    try {
      const json = JSON.parse(content)
      
      const channelList = json.items ? json.items : (Array.isArray(json) ? json : [json])

      const channelPrograms = channelList[0] && channelList[0].items ? channelList[0].items : []

      channelPrograms.forEach(program => {
        programs.push({
          title: program.title,
          description: program.description || program.list_image_description || null,
          start: dayjs(program.start_time),
          stop: dayjs(program.end_time),
          image: (program.image && program.image.list ? `https://akamaividz2.zee5.com/image/upload/resources/${program.id}/list/${program.image.list}.jpg` : program.list_image) || null,
          category: program.genres && program.genres.length ? program.genres.map(g => g.value) : null,
          lang: program.languages && program.languages.length ? program.languages : null
        })
      })

    } catch (e) {
      console.error('Error parsing programs:', e)
      return programs
    }

    return programs
  },


  async channels() {
    try {
      const url = 'https://catalogapi.zee5.com/v1/channel?page=1&page_size=500'
      const response = await axios.get(url)
      const items = response.data.items || []

      return items.map(item => ({
        lang: 'en',
        site_id: item.id,
        name: item.title,
        logo: item.list_image ? `https://akamaividz2.zee5.com/image/upload/resources/${item.id}/channel_list/${item.list_image}` : null
      }))
    } catch (error) {
      console.error('Error fetching channels:', error.message)
      return []
    }
  }
}
