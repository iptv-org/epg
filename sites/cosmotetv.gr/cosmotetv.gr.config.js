const dayjs = require('dayjs')
const utc = require('dayjs/plugin/utc')
const customParseFormat = require('dayjs/plugin/customParseFormat')
const timezone = require('dayjs/plugin/timezone')

dayjs.extend(utc)
dayjs.extend(customParseFormat)
dayjs.extend(timezone)

module.exports = {
  site: 'cosmotetv.gr',
  days: 5,
  request: {
    cache: {
      ttl: 60 * 60 * 1000 // 1 hour
    },
    method: 'GET',
    headers: {
      referer: 'https://www.cosmotetv.gr/',
      'User-Agent':
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36',
      Accept: '*/*',
      'Accept-Language': 'en-US,en;q=0.9',
      'Accept-Encoding': 'gzip, deflate, br, zstd',
      Origin: 'https://www.cosmotetv.gr',
      'Sec-Ch-Ua': '"Not.A/Brand";v="24", "Chromium";v="131", "Google Chrome";v="131"',
      'Sec-Ch-Ua-Mobile': '?0',
      'Sec-Ch-Ua-Platform': '"Windows"',
      'Sec-Fetch-Dest': 'empty',
      'Sec-Fetch-Mode': 'cors',
      'Sec-Fetch-Site': 'cross-site'
    }
  },
  url: function ({ date, channel }) {
    const startOfDay = dayjs(date).startOf('day').utc().unix()
    const endOfDay = dayjs(date).endOf('day').utc().unix()
    return `https://mwapi-prod.cosmotetvott.gr/api/v3.4/epg/listings/el?from=${startOfDay}&to=${endOfDay}&callSigns=${channel.site_id}&endingIncludedInRange=false`
  },
  parser: function ({ content }) {
    let programs = []
    const data = JSON.parse(content)
    data.channels.forEach(channel => {
      channel.items.forEach(item => {
        const start = dayjs(item.startTime).utc().toISOString()
        const stop = dayjs(item.endTime).utc().toISOString()
        programs.push({
          title: item.title,
          description: item.description || 'No description available',
          category: item.qoe.genre,
          image: item.thumbnails.standard,
          start,
          stop
        })
      })
    })
    return programs
  },
  async channels() {
    const axios = require('axios')
    try {
      const response = await axios.get(
        'https://mwapi-prod.cosmotetvott.gr/api/v3.4/epg/channels/all/el',
        {
          headers: this.request.headers
        }
      )
      const data = response.data

      if (data && data.channels) {
        return data.channels.map(item => ({
          lang: 'el',
          site_id: item.callSign,
          name: item.title
          //logo: item.logos.square
        }))
      } else {
        console.error('Unexpected response structure:', data)
        return []
      }
    } catch (error) {
      console.error('Error fetching channel data:', error)
      return []
    }
  }
}
