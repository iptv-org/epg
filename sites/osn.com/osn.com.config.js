const axios = require('axios')
const dayjs = require('dayjs')
const utc = require('dayjs/plugin/utc')
const timezone = require('dayjs/plugin/timezone')
const crypto = require('crypto')

dayjs.extend(utc)
dayjs.extend(timezone)

/**
 * OSN.COM note:
 * - API allows only at max 5 channels, otherwise returns 406
 */

// https://www.osn.com/_next/static/chunks/87cf1e375968671c.js

const cipherName = 'aes-256-cbc'
const cipherKey = Buffer.from('65a04b9b5591f27c837fac433274b494403e0eec5b43698060c28e1162d4460f', 'hex')
const cipherIv = Buffer.from('b7cc0a48d6d023bc1a2a670953ec5622', 'hex')

const tz = dayjs.tz.guess()
const oneDayMs = 864e5
const headers = {}
const caches = {}
let allChannels

module.exports = {
  site: 'osn.com',
  days: 2,
  async url({ date }) {
    return (await getUrlData(date)).url
  },
  request: {
    cache: {
      ttl: 24 * 60 * 60 * 1000 // 1 day
    },
    async headers({ date }) {
      return await getHeaders(date)
    }
  },
  async parser({ content, channel, date }) {
    const programs = []
    content = getDecryptedData(content)
    if (Array.isArray(content?.entries)) {
      // get remaining segments entries
      const cacheId = date.format('YYYYMMDD')
      if (caches[cacheId] === undefined) {
        caches[cacheId] = []
        const segments = await getUrlData(date, false)
        while (segments.length) {
          const segment = segments.shift()
          const result = await axios
            .get(segment.url, { headers: await getHeaders(segment.data) })
            .then(res => getDecryptedData(res.data))
            .catch(err => console.error(`${segment.url}: ${err.message}!`))
          if (Array.isArray(result?.entries)) {
            caches[cacheId].push(...result.entries)
          }
        }
        // add 5s delay to avoid 406
        await new Promise(resolve => setTimeout(resolve, 5000))
      }
      // add entries from cache
      if (Array.isArray(caches[cacheId])) {
        content.entries.push(...caches[cacheId])
      }
      content.entries
        .filter(entry => entry.guid == channel.site_id)
        .forEach(entry => {
          if (Array.isArray(entry.listings)) {
            const listings = entry.listings
              .map(listing => {
                const res = {
                  title: dotProp(listing, `program.titleLocalized.${channel.lang}`),
                  subTitle: dotProp(listing, `program.osnprogram$seriesTitleLocalized.${channel.lang}`),
                  description: dotProp(listing, `program.descriptionLocalized.${channel.lang}`),
                  start: dayjs.tz(listing.startTime, tz),
                  stop: dayjs.tz(listing.endTime, tz),
                  categories: (dotProp(listing, 'program.tags') || [])
                    .map(tag => dotProp(tag, `titleLocalized.${channel.lang}`)),
                  image: dotProp(listing, `program.thumbnails.landscapeTitleImage-${channel.lang}.url`),
                  season: dotProp(listing, 'program.tvSeasonNumber'),
                  episode: dotProp(listing, 'program.tvSeasonEpisodeNumber'),
                  date: dotProp(listing, 'program.year')
                }
                if (res.subTitle) {
                  const subTitle = res.title
                  res.title = res.subTitle
                  res.subTitle = subTitle
                }
                if (res.date) {
                  res.date = `${res.date}`
                }
                return res
              })
            programs.push(...listings)
          }
        })
    }

    return programs
  },
  async channels({ lang = 'ar' }) {
    const channels = []
    const items = await fetchChannels()
    if (Array.isArray(items)) {
      channels.push(...items.map(item => ({
        lang,
        site_id: item.guid,
        name: item.title
      })))
    }

    return channels
  }
}

async function fetchChannels() {
  if (allChannels === undefined) {
    const result = await axios
      .get('https://www.osn.com/apidata/channels?platform=Android', { headers: await getHeaders() })
      .then(res => getDecryptedData(res.data))
      .catch(console.error)

    if (Array.isArray(result)) {
      allChannels = result
    }
  }

  return allChannels
}

async function getHeaders(data) {
  if (dayjs.isDayjs(data)) {
    data = (await getUrlData(data)).data
  }
  const res = { ...headers }
  if (data) {
    res['X-Encrypted-Data'] = getEncryptedData(data)
  }

  return res
}

async function getUrlData(date, first = true) {
  const parts = []
  const startOfDay = date.tz(tz).startOf('d')
  const endOfDay = startOfDay.add(oneDayMs, 'ms')
  const startStop = {
    startTime: startOfDay.valueOf(),
    endTime: endOfDay.valueOf()
  }
  await fetchChannels()
  const segments = await getUrlSegments()
  let i = 0
  for (const v of segments) {
    const data = {
      url: `https://www.osn.com/apidata/tv-schedule-timeline?t=batch${++i}-time${
          startStop.startTime
        }-${
          startStop.endTime
        }-boxAndroid`,
      data: {
        channelGuid: v.join('|'),
        ...startStop
      }
    }
    if (first) {
      return data
    } else if (i === 1) {
      continue
    }
    parts.push(data)
  }

  return parts
}

async function getUrlSegments() {
  await fetchChannels()
  const segments = []
  const _channels = [...allChannels.map(item => item.guid)]
  while (_channels.length) {
    segments.push(_channels.splice(0, 5))
  }
  return segments
}

function getEncryptedData(data) {
  return encrypt(JSON.stringify(data))
}

function getDecryptedData(data) {
  if (typeof data === 'string' || Buffer.isBuffer(data)) {
    data = JSON.parse(data)
  }
  if (data?.encrypted) {
    data = JSON.parse(decrypt(data.encrypted))
  }

  return data
}

function encrypt(data, encoding = 'utf8') {
  const cipher = crypto.createCipheriv(cipherName, cipherKey, cipherIv)
  const encrypted = cipher.update(data, encoding, 'base64')

  return (encrypted + cipher.final('base64'))
}

function decrypt(data, encoding = 'utf8') {
  const decipher = crypto.createDecipheriv(cipherName, cipherKey, cipherIv)
  const decrypted = decipher.update(data, 'base64', encoding)

  return (decrypted + decipher.final(encoding))
}

function dotProp(o, prop) {
  if (typeof o === 'object') {
    const props = prop.split('.')
    while (props.length) {
      const k = props.shift()
      if (o[k] !== undefined) {
        o = o[k]
      } else {
        break
      }
    }
    if (props.length === 0) {
      return o
    }
  }
}
