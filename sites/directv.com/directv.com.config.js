const axios = require('axios')
const dayjs = require('dayjs')
const utc = require('dayjs/plugin/utc')

dayjs.extend(utc)

let token = null
async function fetchToken() {
  if (token) return token
  try {
    token = await axios
      .post('https://api.cld.dtvce.com/authn-tokengo/v3/v2/tokens?client_id=DTVE_DFW_WEB_Chrome_G', null, { 
        headers: { 
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36',
          'cache-control': 'no-cache',
          'origin': 'https://www.directv.com',
          'pragma': 'no-cache',
          'priority': 'u=1, i',
          'referer': 'https://www.directv.com/',
          'sec-ch-ua': '"Chromium";v="146", "Not-A.Brand";v="24", "Brave";v="146"',
          'sec-ch-ua-mobile': '?0',
          'sec-ch-ua-platform': '"Windows"',
          'sec-fetch-dest': 'empty',
          'sec-fetch-mode': 'cors',
          'sec-fetch-site': 'cross-site',
          'sec-gpc': '1'
        } 
      })
      .then(r => r.data)
      .then(d => d.access_token)
    return token
  } catch (error) {
    console.error('Error fetching token (potential geo-block or API issue):', error)
    return null
  }
}

module.exports = {
  site: 'directv.com',
  days: 2,
  request: {
      cache: {
        ttl: 60 * 60 * 1000 // 1 hour
      },
      async headers() {
        await fetchToken()
        return {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36',
          Authorization: `Bearer ${token}`,
          'cache-control': 'no-cache',
          'origin': 'https://www.directv.com',
          'pragma': 'no-cache',
          'priority': 'u=1, i',
          'referer': 'https://www.directv.com/',
          'sec-ch-ua': '"Chromium";v="146", "Not-A.Brand";v="24", "Brave";v="146"',
          'sec-ch-ua-mobile': '?0',
          'sec-ch-ua-platform': '"Windows"',
          'sec-fetch-dest': 'empty',
          'sec-fetch-mode': 'cors',
          'sec-fetch-site': 'cross-site',
          'sec-gpc': '1'
      }
    }
  },
  url({ date, channel }) {
    return `https://api.cld.dtvce.com/discovery/edge/schedule/v1/service/schedule?startTime=${date.valueOf()}&endTime=${date.add(24, 'hour').valueOf()}&channelIds=${channel.site_id}&include4K=false&is4Kcompatible=false&includeTVOD=true`
  },
  async parser({ content, channel }) {
    const programs = []
    const items = parseItems(content, channel)
    for (let item of items) {
      if (item.programID === '-1') continue
      const start = parseStart(item)
      const stop = parseStop(item)
      programs.push({
        title: item.title,
        sub_title: item.episodeTitle,
        description: parseDescription(item),
        rating: parseRating(item),
        date: parseFullReleaseDate(item) ?? parseYear(item),
        category: parseCategory(item),
        season: item.seasonNumber,
        episode: item.episodeNumber,
        image: parseImage(item),
        start,
        stop
      })
    }

    return programs
  },
  async channels() {
    // alternate https://www.directv.com/dtvassets/dtv/dev/uf/CHLUP/chnlListingPageData.json
    // though i don't think you could fetch the schedule from the API with this

    let channels = []
    const html = await axios
      .get('https://api.cld.dtvce.com/discovery/metadata/channel/v5/service/allchannels?sort=OrdCh%253DASC', {
        headers: {
          Authorization: `Bearer ${await fetchToken()}`,
          'Accept-Language': 'en-US,en;q=0.5',
          Connection: 'keep-alive'
        }
      })
      .then(r => r.data)
      .catch(console.log)

      const data = html?.channelInfoList

      if (data && Array.isArray(data)) {
        data.forEach(item => {
          channels.push({
          lang: 'en',
          site_id: item.resourceId,
          name: item.channelName,
          icon: item.imageList && item.imageList.length > 0 ? item.imageList[0].imageUrl : null
          })
        })
      }

    return channels
  }
}

function parseDescription(item) {
  return item ? item.description : null
}
function parseCategory(item) {
  return item && item.genres ? item.genres : null
}
// DirecTV are the only ones to put the episode/movie's full release date. Kudos to them.
function parseFullReleaseDate(item) {
  return item ? item.originalAirDate : null
}
function parseYear(item) {
  return item ? item.releaseYear : null
}
function parseRating(item) {
  return item.parentalRating
    ? {
        system: 'MPA',
        value: item.parentalRating
      }
    : null
}
function parseImage(item) {
  return item.images?.length > 0 ? item.images[0].defaultImageUrl : null
}

function parseStart(item) {
  return dayjs.utc(item.consumables?.[0]?.startTime)
}

function parseStop(item) {
  return dayjs.utc(item.consumables?.[0]?.endTime)
}

function parseItems(content, channel) {
  try {
    const data = JSON.parse(content)
    if (!data) return []
    if (!Array.isArray(data.schedules)) return []

    const channelData = data.schedules.find(i => i.channelId === channel.site_id)
    return channelData?.contents && Array.isArray(channelData.contents) ? channelData.contents : []
  } catch (error) {
    console.error('Error parsing content:', error)
    return []
  }
}
