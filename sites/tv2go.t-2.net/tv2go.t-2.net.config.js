const axios = require('axios')
const dayjs = require('dayjs')
const md5 = require('./jquery.md5')

const API = {
  locale: 'sl-SI',
  version: '9.4',
  format: 'json',
  uuid: '464830403846070',
  token: '6dace810-55d5-11e3-949a-0800200c9a66'
}

const config = {
  site: 'tv2go.t-2.net',
  days: 2,
  url({ date, channel }) {
    const data = config.request.data({ date, channel })
    const endpoint = 'client/tv/getEpg'
    const hash = generateHash(data, endpoint)

    return `https://tv2go.t-2.net/Catherine/api/${API.version}/${API.format}/${API.uuid}/${hash}/${endpoint}`
  },
  request: {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    data({ date, channel }) {
      const channelId = parseInt(channel.site_id)

      return {
        locale: API.locale,
        channelId: [channelId],
        startTime: date.valueOf(),
        endTime: date.add(1, 'd').valueOf(),
        imageInfo: [{ height: 500, width: 1100 }],
        includeBookmarks: false,
        includeShow: true
      }
    }
  },
  parser({ content }) {
    let programs = []
    const items = parseItems(content)
    items.forEach(item => {
      programs.push({
        title: item.name,
        category: parseCategory(item),
        description: parseDescription(item),
        icon: parseIcon(item),
        start: parseStart(item),
        stop: parseStop(item)
      })
    })

    return programs
  },
  async channels() {
    const data = {
      locale: API.locale,
      type: 'TV',
      imageInfo: [{ type: 'DARK', height: 70, width: 98 }]
    }
    const endpoint = 'client/channels/list'
    const hash = generateHash(data, endpoint)
    const response = await axios
      .post(
        `https://tv2go.t-2.net/Catherine/api/${API.version}/${API.format}/${API.uuid}/${hash}/${endpoint}`,
        data,
        {
          headers: {
            'Content-Type': 'application/json'
          }
        }
      )
      .catch(console.log)

    return response.data.channels.map(item => {
      return {
        lang: 'sl',
        site_id: item.id,
        name: item.name
      }
    })
  }
}

function parseStart(item) {
  return dayjs(parseInt(item.startTimestamp))
}

function parseStop(item) {
  return dayjs(parseInt(item.endTimestamp))
}

function parseIcon(item) {
  return item.images && item.images[0] ? `https://tv2go.t-2.net${item.images[0].url}` : null
}

function parseCategory(item) {
  return item.show && Array.isArray(item.show.genres) ? item.show.genres.map(c => c.name) : []
}

function parseDescription(item) {
  return item.show ? item.show.shortDescription : null
}

function parseItems(content) {
  let data
  try {
    data = JSON.parse(content)
  } catch (e) {
    return []
  }
  if (!data || !Array.isArray(data.entries)) return []

  return data.entries
}

function generateHash(data, endpoint) {
  const salt = `${API.token}${API.version}${API.format}${API.uuid}`

  return md5(salt + endpoint + JSON.stringify(data))
}

module.exports = config
