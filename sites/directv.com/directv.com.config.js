const axios = require('axios')
const dayjs = require('dayjs')
const utc = require('dayjs/plugin/utc')

dayjs.extend(utc)

let token = null
async function getToken() {
  if (token) return token
  token = await fetchToken()
  return token
}

async function fetchToken() {
  return axios
    .post('https://api.cld.dtvce.com/authn-tokengo/v3/v2/tokens?client_id=DTVE_DFW_WEB_Chrome_G', { headers: 
        { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36' } 
      })
    .then(r => r.data)
    .then(d => d.access_token)
    .catch(console.err)
}

module.exports = {
  site: 'directv.com',
  days: 2,
  request: async function() {
    return {
      cache: {
        ttl: 60 * 60 * 1000 // 1 hour
      },
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36',
        Authorization: `Bearer ${token}`,
      }
    }
  },
  async url({ date, channel }) {
    await getToken()
    return `https://api.cld.dtvce.com/discovery/edge/schedule/v1/service/schedule?startTime=${date.format('YYYY-MM-DDT00:00:00')}&endTime=${date.add(24, 'hour').format('YYYY-MM-DDT00:00:00')}&channelIds=${channel.site_id}&include4K=false&is4Kcompatible=false&includeTVOD=true`
  },
  async parser({ content, channel }) {
    console.log(content)
    const programs = []
    const items = parseItems(content, channel)
    for (let item of items) {
      if (item.programID === '-1') continue
      const start = parseStart(item)
      const stop = start.add(item.duration, 'm')
      programs.push({
        title: item.title,
        sub_title: item.episodeTitle,
        description: parseDescription(item),
        rating: parseRating(item),
        date: parseYear(item),
        category: item.subcategoryList,
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
          Authorization: `Bearer ${await getToken()}`,
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
function parseYear(item) {
  return item ? item.releaseYear : null
}
function parseRating(item) {
  return item.rating
    ? {
        system: 'MPA',
        value: item.rating
      }
    : null
}
function parseImage(item) {
  return item.images?.length > 0 ? item.images[0].defaultImageUrl : null
}

function parseStart(item) {
  return dayjs.utc(item.airTime)
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
