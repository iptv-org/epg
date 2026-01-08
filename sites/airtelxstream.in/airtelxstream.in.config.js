const axios = require('axios')
const dayjs = require('dayjs')

const HEADERS = {
  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36',
  'Referer': 'https://www.airtelxstream.in/'
}

module.exports = {
  site: 'airtelxstream.in',
  days: 2,
  request: {
    cache: {
      ttl: 60 * 60 * 1000
    },
    headers: HEADERS
  },

    // full url 1 = https://livetv.airtel.tv/v1/epg/page?appId=WEB&start=now&end=nowPLUS1d&os=WEBOS&bn=87&dt=BROWSER&nonLinear=true
	// full url 2 = https://epg.airtel.tv/app/v3/content/epg?dt=BROWSER&os=WEBOS&ln=en&lg=en,hi&isDth=false&xpprbe=false&dth=false&chromecast=false&bn=87&mwTvPack=200292&startTime=1765218600000&endTime=1765305000000&appId=WEB
	// full url 3 = https://epg.airtel.tv/app/v2/content/channel/epg?dt=BROWSER&os=WEBOS&ln=en&lg=en,hi&isDth=false&xpprbe=false&dth=false&chromecast=false&bn=87&mwTvPack=200292&channelId=MWTV_LIVETVCHANNEL_547&startTime=1766860200001&endTime=1766946599999&appId=WEB
  url({ channel, date }) {
    const startTime = date.valueOf()
    const endTime = date.add(1, 'day').valueOf()
    const baseUrl = 'https://epg.airtel.tv/app/v2/content/channel/epg'
    
    return `${baseUrl}?channelId=${channel.site_id}&startTime=${startTime}&endTime=${endTime}`
  },

  parser({ content }) {
    let programs = []
    
    try {
        const parsed = JSON.parse(content)
        const dynamicSiteId = Object.keys(parsed.programGuide)[0]
		programs = parsed.programGuide[dynamicSiteId] || []
    } catch (e) {
        console.error('Error parsing JSON content', e)
        return [] 
    }

    return programs.map(program => {
      return {
        title: program.title,
        description: program.desc || null,
        start: dayjs(program.startTime),
        stop: dayjs(program.endTime),
        image: program.images.LANDSCAPE_169_HD || program.images.LANDSCAPE_169 || program.images.FEATURE_BANNER_HD || null,
        icon: program.images.LOGO_HD || program.images.LOGO || null,
        category: program.genres || []
      }
    })
  },

        // full url = https://livetv.airtel.tv/v1/livechannel?appId=WEB&nonLinear=true&os=WEBOS&bn=87&dt=BROWSER
  async channels() {
    const url = 'https://livetv.airtel.tv/v1/livechannel'
    
    try {
        const response = await axios.get(url, { headers: HEADERS })
        const jsonPayload = response.data

        if (!jsonPayload || !jsonPayload.data) {
            console.log('No channel data found in API response')
            return []
        }

        const channelsMap = new Map()
		
		jsonPayload.data.forEach(channel => {
          const siteId = channel.epgChannelId || channel.id
		  
		  if (!channelsMap.has(siteId)) {
			channelsMap.set(siteId, {
		      lang: 'en',
              site_id: siteId,
              name: channel.title,
              // logo: channel.images.LOGO_HD || channel.images.LOGO || channel.images.LANDSCAPE_169 || null
            })
		  }
        })
		return Array.from(channelsMap.values())
		
    } catch (error) {
        console.error('Failed to fetch channels list:', error.message)
        return []
    }
  }
}