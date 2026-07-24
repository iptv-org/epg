const fs = require('fs')
const path = require('path')
const https = require('https')
const axios = require('axios')
const dayjs = require('dayjs')
const utc = require('dayjs/plugin/utc')

dayjs.extend(utc)

const API_ENDPOINT = 'https://api.toonamiaftermath.com'

// Let's Encrypt YR1 and YR2 will be expired on Sep  2 23:59:59 2028 GMT
const certfile = path.join(__dirname, '__data__', 'certificate.pem')
const httpsAgent = new https.Agent({ ca: fs.readFileSync(certfile) })
const caches = {}

module.exports = {
  site: 'toonamiaftermath.com',
  days: 3,
  request: {
    cache: {
      ttl: 24 * 60 * 60 * 1000 // 1 day
    },
    httpsAgent
  },
  async url({ channel, date }) {
    return await getUrl(channel, date)
  },
  async parser({ channel, date, content }) {
    const programs = []
    const delay = parseInt(channel.site_id.split('+')[1]) || 0
    const cdate = date.startOf('d')
    const items = parseItems(content)
    // fetch other playlist URLs if exist
    if (items.length && Array.isArray(date.urls)) {
      for (const url of date.urls) {
        if (caches[url] !== undefined) {
          items.push(...caches[url])
        } else {
          const result = await axios.get(url, { httpsAgent })
            .then(res => res.data)
            .catch(console.error)
          const newItems = parseItems(result)
          caches[url] = newItems
          items.push(...newItems)
        }
      }
    }
    items.forEach(item => {
      const start = getDate(item.startDate, delay)
      const stop = getDate(item.endDate, delay)
      if (isDate(start, cdate) || isDate(stop, cdate, true)) {
        programs.push({
          title: item.name,
          description: item.info?.fullname,
          sub_title: item.info?.episode,
          image: item.info?.image,
          start,
          stop
        })
      }
    })

    return programs
  },
  async channels() {
    const channels = []
    const result = await axios.get('https://www.toonamiaftermath.com/bundle.js')
      .then(res => res.data)
      .catch(err => console.error(err.toString()))

    const matches = result.match(/channels:(\[.*?\]),siteConfigs:/)
    if (matches[1]) {
      const vm = require('vm')
      const items = vm.runInNewContext(`const o=${matches[1]}; o`)
      if (Array.isArray(items)) {
        channels.push(...items
          .filter(item => item.scheduleName)
          .map(item => ({
            lang: 'en',
            site_id: `${item.scheduleName}${item.streamDelay ? '+' + item.streamDelay : ''}`,
            name: item.name
          }))
        )
      }
    }

    return channels
  }
}

async function getUrl(channel, date) {
  const scheduleName = channel.site_id.split('+')[0]
  const url = new URL(`${API_ENDPOINT}/playlists?scheduleName=${
    scheduleName
  }&startDate=${
    date.startOf('d').toJSON()
  }&thisWeek=true&weekStartDay=monday`)
  const playlists = await axios.get(url.toString(), { httpsAgent })
    .then(res => res.data)
    .catch(err => console.error(err.toString()))

  const urls = []
  if (Array.isArray(playlists)) {
    const dt = date.startOf('d')
    playlists
      .filter(p => isDate(getDate(p.startDate), dt) || isDate(getDate(p.endDate), dt, true))
      .forEach(p => {
        urls.push(`${API_ENDPOINT}/playlist?id=${p._id}&addInfo=true`)
      })
  }
  if (!urls.length) {
    throw new Error(`Unable to get schedule URL for ${scheduleName}!`)
  }
  const playlistUrl = urls.shift()
  if (urls.length) {
    // pass next playlist URLs in date object
    date.urls = urls
  }

  return playlistUrl
}

function getDate(dt, delay = 0) {
  return dayjs.utc(dt).add(delay, 'm')
}

function isDate(dt, ref, end) {
  return dt.isSame(ref, 'd') && (end ? dt > ref : true)
}

function parseItems(content) {
  if (!content) return []
  if (typeof content === 'string' || Buffer.isBuffer(content)) {
    content = JSON.parse(content)
  }
  if (!content || !content.playlist) return []

  return content.playlist.blocks.reduce((acc, curr) => {
    // short media type has no title, use block title instead
    curr.mediaList.forEach(media => {
      if (media.name === undefined) {
        media.name = curr.name
      }
    })

    return acc.concat(curr.mediaList)
  }, [])
}
