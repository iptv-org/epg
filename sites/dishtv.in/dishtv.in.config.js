const axios = require('axios')
const dayjs = require('dayjs')
const utc = require('dayjs/plugin/utc')
const tz = require('dayjs/plugin/timezone')
const timezone = 'Asia/Kolkata'

dayjs.extend(utc)
dayjs.extend(tz)

let authToken

module.exports = {
  site: 'dishtv.in',
  days: 2,
  url: 'https://epg.mysmartstick.com/dishtv/api/v1/epg/entities/programs',
  request: {
    method: 'POST',
    async headers() {
      await fetchToken()

      return {
        Authorization: authToken
      }
    },
    data({ channel, date }) {
      return {
        allowPastEvents: true,
        channelid: channel.site_id,
        date: date.format('DD/MM/YYYY')
      }
    }
  },
  parser: ({ content }) => {
    const programs = []
    const items = parseItems(content)
    items.forEach(item => {
      programs.push({
        title: parseTitle(item),
        description: parseDescription(item),
        category: parseCategory(item),
        actors: item.credits.actors,
        directors: item.credits.directors,
        producers: item.credits.producers,
        date: item.productionyear,
        icon: parseIcon(item),
        image: parseImage(item),
        episode: parseEpisode(item),
        start: dayjs(item.start),
        stop: dayjs(item.stop)
      })
    })

    return programs
  },
  async channels() {
    await fetchToken()

    const totalPages = await fetchPages()

    const queue = Array.from(Array(totalPages).keys()).map(i => {
      const data = new FormData()
      data.append('pageNum', i + 1)
      data.append('date', dayjs.tz(dayjs(), timezone).format('DD/MM/YYYY'))

      return {
        method: 'post',
        url: 'https://www.dishtv.in/services/epg/channels',
        data,
        headers: {
          'authorization-token': authToken
        }
      }
    })

    const channels = []
    for (let item of queue) {
      const data = await axios(item)
        .then(r => r.data)
        .catch(console.error)

      data.programDetailsByChannel.forEach(channel => {
        channels.push({
          lang: 'en',
          site_id: channel.channelid,
          name: channel.channelname
        })
      })
    }

    return channels
  }
}

function parseTitle(item) {
  return Object.values(item.regional)
    .map(region => ({
      lang: region.languagecode,
      value: region.title
    }))
    .filter(i => Boolean(i.value))
}

function parseDescription(item) {
  return Object.values(item.regional)
    .map(region => ({
      lang: region.languagecode,
      value: region.desc
    }))
    .filter(i => Boolean(i.value))
}

function parseCategory(item) {
  return Object.values(item.regional)
    .map(region => ({
      lang: region.languagecode,
      value: region.genre
    }))
    .filter(i => Boolean(i.value))
}

function parseEpisode(item) {
  return item['episode-num'] ? parseInt(item['episode-num']) : null
}

function parseIcon(item) {
  return item.programmeurl || null
}

function parseImage(item) {
  return item?.images?.landscape?.['1280x720'] ? item.images.landscape['1280x720'] : null
}

function parseItems(content) {
  try {
    const data = JSON.parse(content)

    return Array.isArray(data) ? data : []
  } catch {
    return []
  }
}

async function fetchToken() {
  if (authToken) return

  const data = await axios
    .post('https://www.dishtv.in/services/epg/signin', null, {
      headers: {
        'sec-fetch-dest': 'empty',
        'sec-fetch-mode': 'cors',
        'sec-fetch-site': 'same-origin',
        'x-requested-with': 'XMLHttpRequest',
        Referer: 'https://www.dishtv.in/channel-guide.html',
        'User-Agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/58.0.3029.110 Safari/537.36'
      }
    })
    .then(r => r.data)
    .catch(console.error)

  authToken = data.token
}

async function fetchPages() {
  const formData = new FormData()
  formData.append('pageNum', 1)
  formData.append('date', dayjs.tz(dayjs(), timezone).format('DD/MM/YYYY'))

  const data = await axios
    .post('https://www.dishtv.in/services/epg/channels', formData, {
      headers: { 'authorization-token': authToken }
    })
    .then(r => r.data)
    .catch(console.error)

  return data.totalPages ? parseInt(data.totalPages) : 0
}
