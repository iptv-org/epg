const axios = require('axios')
const dayjs = require('dayjs')

// --- CONFIGURATION ---
const HEADERS = {
  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:147.0) Gecko/20100101 Firefox/147.0',
  'Referer': 'https://watch.whaletvplus.com/',
  'Origin': 'https://watch.whaletvplus.com'
}
const apiToken = '4ef13b5f3d2744e3b0a569feb8dde298'

let authTokenPromise = null

module.exports = {
  site: 'watch.whaletvplus.com',
  days: 2,

  request: {
    cache: {
      ttl: 60 * 60 * 1000 // Cache 1 hour
    },
    headers: async function() {
      const token = await getAuthToken()
      return {
        ...HEADERS,
        'token': token
      }
    }
  },

  url: function ({ channel, date }) {
    const start = date.valueOf()
    const end = date.add(1, 'day').valueOf()

    return `https://rlaxx.zeasn.tv/livetv/api/device/browser/v1/epg?channelIds=${channel.site_id}&startTime=${start}&endTime=${end}`
  },

  parser: async function ({ content }) {
    let json
    try {
      json = JSON.parse(content)
    } catch (e) {
      console.error('Error parsing JSON:', e)
      return []
    }

    if (!json.data || !Array.isArray(json.data) || !json.data[0] || !Array.isArray(json.data[0].ptList)) {
      return []
    }

    const programs = json.data[0].ptList
    const detailsCache = {}

    return await limit(programs, async (p) => {
      const program = {
        title: p.prgTitle,
        start: dayjs(Number(p.prgStm)),
        stop: dayjs(Number(p.prgEtm))
      }

      if (p.prgchId) {
        if (!detailsCache[p.prgchId]) {
          detailsCache[p.prgchId] = fetchProgramDetail(p.prgchId)
        }
        const detail = await detailsCache[p.prgchId]
        if (detail) {
          program.description = detail.prgDesc || null
          program.season = detail.seasonNumber || null
          program.episode = detail.episodeNumber || null
          program.sub_title = detail.prgTitle || detail.seriesTitle || null

          if (program.title === program.sub_title) {
            program.sub_title = null
          }

          if (detail.images && Array.isArray(detail.images)) {
            const bestImg = detail.images.find((i) => i.pimgWidth === '1920') || detail.images[0]
            if (bestImg) program.image = bestImg.pimgUrl
          }
        }
      }
      return program
    })
  },

  async channels() {
    const token = await getAuthToken()
    
    const countries = [
      'IN', 'AU', 'NZ', 'ZA', 'US', 'BR', 'MX', 'AR', 'CO', 'CL', 'CA',
      'GB', 'DE', 'FR', 'IT', 'ES', 'PL', 'TR', 'AT', 'CH', 'NL', 'PT',
      'BE', 'SE', 'NO', 'DK', 'FI'
    ]

    const requests = countries.map(country => 
      axios.get('https://rlaxx.zeasn.tv/livetv/api/device/browser/v1/category/channels', {
        params: { countryCode: country, langCode: 'en' },
        headers: { ...HEADERS, token }
      }).then(r => r.data?.data || []).catch(() => [])
    )

    const results = await Promise.all(requests)
    const allChannels = results.flat().flatMap(group => group.channels || [])

    const uniqueChannels = new Map()
    for (const ch of allChannels) {
      if (!uniqueChannels.has(ch.chlId)) {
        uniqueChannels.set(ch.chlId, {
          lang: (ch.chlLangCode ? ch.chlLangCode.split('-')[0] : 'en'),
          site_id: ch.chlId,
          name: ch.chlName,
          // logo: ch.imageIdentifier ? `https://d3b6luslimvglo.cloudfront.net/images/79/rlaxximages/channels-rescaled/icon-white/${ch.imageIdentifier}_white.png` : null
        })
      }
    }

    return Array.from(uniqueChannels.values())
  }
}

async function limit(items, fn, concurrency = 20) {
  const results = []
  for (let i = 0; i < items.length; i += concurrency) {
    const batch = items.slice(i, i + concurrency)
    results.push(...(await Promise.all(batch.map(fn))))
  }
  return results
}

async function getAuthToken() {
  if (authTokenPromise) return authTokenPromise

  authTokenPromise = (async () => {
    try {
      const response = await axios.get('https://rlaxx.zeasn.tv/livetv/api/v1/auth/access', {
        params: { uuid: '1', apiToken, langCode: 'en' },
        headers: HEADERS
      })
      
      if (response.data && response.data.data && response.data.data.token) {
        return response.data.data.token
      }
      
      throw new Error('apiToken invalid or expired. Please update config.')
    } catch (error) {
      authTokenPromise = null
      throw new Error(error.message)
    }
  })()

  return authTokenPromise
}

async function fetchProgramDetail(programId) {
  const token = await getAuthToken()
  try {
    const response = await axios.get(`https://rlaxx.zeasn.tv/livetv/api/device/browser/v1/epg/detail/${programId}`, {
      headers: {
        ...HEADERS,
        'token': token
      },
      timeout: 5000 
    })
    return response.data && response.data.data ? response.data.data : null
  } catch {
    return null
  }
}