const axios = require('axios')
const dayjs = require('dayjs')
const utc = require('dayjs/plugin/utc')
const timezone = require('dayjs/plugin/timezone')
const crypto = require('crypto')

dayjs.extend(utc)
dayjs.extend(timezone)

// https://www.osn.com/_next/static/chunks/87cf1e375968671c.js

const cipherName = 'aes-256-cbc'
const cipherKey = Buffer.from('65a04b9b5591f27c837fac433274b494403e0eec5b43698060c28e1162d4460f', 'hex')
const cipherIv = Buffer.from('b7cc0a48d6d023bc1a2a670953ec5622', 'hex')

const tz = dayjs.tz.guess()
const oneDayMs = 864e5
const headers = {
  'User-Agent':
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/118.0.0.0 Safari/537.36 OPR/104.0.0.0'
}
let batch = 0

module.exports = {
  site: 'osn.com',
  days: 2,
  url({ channel, date }) {
    const data = getChannelData({ channel, date })
    return `https://www.osn.com/apidata/tv-schedule-timeline?t=batch${++batch}-time${data.startTime}-${data.endTime}-boxAndroid`
  },
  request: {
    headers({ channel, date }) {
      return {
        ...headers,
        'X-Encrypted-Data': encrypt(JSON.stringify(getChannelData({ channel, date })))
      }
    }
  },
  parser({ content, channel }) {
    const programs = []
    if (typeof content === 'string' || Buffer.isBuffer(content)) {
      content = JSON.parse(content)
    }
    if (content?.encrypted) {
      content = JSON.parse(decrypt(content.encrypted))
    }
    if (Array.isArray(content?.entries)) {
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
    const result = await axios
      .get('https://www.osn.com/apidata/channels?platform=Android', { headers })
      .then(response => response.data)
      .catch(console.error)

    if (result?.encrypted) {
      const items = JSON.parse(decrypt(result.encrypted))
      channels.push(...items.map(item => ({
        lang,
        site_id: item.guid,
        name: item.title
      })))
    }
    return channels
  }
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

function getChannelData({ channel, date }) {
  const startOfDay = date.tz(tz).startOf('d')
  return {
    channelGuid: channel.site_id,
    startTime: startOfDay.valueOf(),
    endTime: startOfDay.valueOf() + oneDayMs
  }
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
