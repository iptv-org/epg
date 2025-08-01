const axios = require('axios')
const dayjs = require('dayjs')
const utc = require('dayjs/plugin/utc')
const timezone = require('dayjs/plugin/timezone')
const debug = require('debug')('site:tvguide.com')

dayjs.extend(utc)
dayjs.extend(timezone)

const providerId = '9100001138'
const maxDuration = 240
const segments = 1440 / maxDuration
const headers = {
  'referer': 'https://www.tvguide.com/',
  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/137.0.0.0 Safari/537.36',
}

const east_channels = [
  '5StarMax', 'ABC Network Feed', 'ActionMax', 'A&E', 'AMC', 'Animal Planet', 'BBC America',
  'BET', 'BET Her', 'Bravo', 'Cartoon Network', 'CBS National', 'Cinemax', 'CMT', 'Comedy Central',
  'Discovery', 'Disney', 'Disney Junior', 'Disney XD', 'E!', 'Flix', 'Food Network', 'FOX', 'Freeform',
  'Fuse HD', 'FX', 'FXX', 'FYI', 'Game Show Network', 'Hallmark', 'Hallmark Mystery', 'HBO 2',
  'HBO Comedy', 'HBO', 'HBO Family', 'HBO Signature', 'HBO Zone', 'HGTV', 'History', 'IFC',
  'Investigation Discovery', 'ION', 'Lifetime', 'LMN', 'LOGO', 'MAGNOLIA Network', 'MGM+ Hits HD',
  'MoreMax', 'MovieMax', 'MTV2', 'MTV', 'National Geographic', 'National Geographic Wild', 'NBC National',
  'Nickelodeon', 'Nick Jr.', 'Nicktoons', 'OuterMax', 'OWN', 'Oxygen', 'Paramount Network', 'PBS HD',
  'Pop Network', 'SHOWTIME 2', 'Paramount+ with Showtime', 'SHOWTIME EXTREME', 'SHOWTIME FAMILY ZONE',
  'SHOWTIME NEXT', 'SHOWTIME SHOWCASE', 'SHOWTIME WOMEN', 'SHOxBET', 'Smithsonian', 'STARZ Cinema',
  'STARZ Comedy', 'STARZ', 'STARZ Edge', 'STARZ ENCORE Action', 'STARZ ENCORE Black',
  'STARZ ENCORE Classic', 'STARZ ENCORE', 'STARZ ENCORE Family', 'STARZ ENCORE Suspense',
  'STARZ ENCORE Westerns', 'STARZ InBlack', 'STARZ Kids & Family', 'Sundance TV', 'Syfy', 'tbs',
  'Turner Classic Movies', 'TeenNick', 'Telemundo', 'The Movie', 'The Movie Xtra', 'ThrillerMax', 'TLC',
  'TNT', 'Travel', 'truTV', 'TV Land', 'Universal Kids', 'USA', 'VH1', 'WE tv', 'Univision'
]

module.exports = {
  site: 'tvguide.com',
  days: 2,
  request: {
    headers: function () {
      return headers
    },
    responseType: 'application/json',
    decompress: true,
    cache: {
      ttl: 24 * 60 * 60 * 1000 // 1 day
    }
  },
  async url({ date, segment = 1 }) {
    const params = []
    if (module.exports.apiKey === undefined) {
      module.exports.apiKey = await module.exports.fetchApiKey()
      debug('Got api key', module.exports.apiKey)
    }
    if (date) {
      if (segment > 1) {
        date = date.add((segment - 1) * maxDuration, 'm')
      }
      params.push(`start=${date.unix()}`, `duration=${maxDuration}`)
    }
    params.push(`apiKey=${module.exports.apiKey}`)

    return date ?
      `https://backend.tvguide.com/tvschedules/tvguide/${providerId}/web?${params.join('&')}` :
      `https://backend.tvguide.com/tvschedules/tvguide/serviceprovider/${providerId}/sources/web?${params.join('&')}`
  },
  async parser({ content, date, channel, fetchSegments = true }) {
    const programs = []
    const f = data => {
      const result = []
      if (typeof data === 'string') {
        data = JSON.parse(data)
      }
      if (data && Array.isArray(data?.data?.items)) {
        data.data.items
          .filter(i => i.channel.sourceId.toString() === channel.site_id)
          .forEach(i => {
            result.push(...i.programSchedules.map(p => {
              return { i: p, url: p.programDetails }
            }))
          })
      }

      return result
    }
    const queues = f(content)
    if (queues.length && fetchSegments) {
      for (let segment = 2; segment <= segments; segment++) {
        const segmentUrl = await module.exports.url({ date, segment })
        debug(`fetch segment ${segment}: ${segmentUrl}`)
        try {
          const res = await axios.get(segmentUrl, { headers })
          queues.push(...f(res.data))
        } catch (err) {
          debug(`Failed to fetch segment ${segment}: ${err.message}`)
        }
      }
    }
    for (const queue of queues) {
      try {
        const res = await axios.get(queue.url, { headers })
        const item = res.data?.data?.item || queue.i
        programs.push({
          title: item.title || queue.i.title,
          sub_title: item.episodeNumber ? item.episodeTitle : null,
          description: item.description,
          season: item.seasonNumber,
          episode: item.episodeNumber,
          rating: item.rating ? { system: 'MPA', value: item.rating } : null,
          categories: Array.isArray(item.genres) ? item.genres.map(g => g.name) : null,
          start: dayjs.unix(item.startTime || queue.i.startTime),
          stop: dayjs.unix(item.endTime || queue.i.endTime),
        })
      } catch (err) {
        debug(`Failed to fetch program details ${queue.url}: ${err.message}`)
      }
    }
    return programs
  },
  async channels() {
    const channels = []
    try {
      const data = await axios
        .get(await this.url({}), { headers })
        .then(r => r.data)
      data.data.items.forEach(item => {
        const finalName = item.fullName.replace(/Channel|Schedule/g, '').trim()
        const isEast = east_channels.some(name => name.toLowerCase().includes(finalName.toLowerCase()))
        channels.push({
          lang: 'en',
          site_id: item.sourceId,
          xmltv_id: finalName.replaceAll(/[ '&]/g, '') + '.us' + (isEast ? '@East' : ''),
          name: finalName
        })
      })
    } catch (err) {
      console.error('Failed to fetch channels:', err.message)
    }
    return channels
  },
  async fetchApiKey() {
    try {
      const data = await axios
        .get('https://www.tvguide.com/listings/')
        .then(r => r.data)
      return data ? data.match(/apiKey=([a-zA-Z0-9]+)&/)[1] : null
    } catch (err) {
      console.error('Failed to fetch API key:', err.message)
      return null
    }
  }
}