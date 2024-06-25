const axios = require('axios')
const cheerio = require('cheerio')
const dayjs = require('dayjs')
const utc = require('dayjs/plugin/utc')
const timezone = require('dayjs/plugin/timezone')
const customParseFormat = require('dayjs/plugin/customParseFormat')

dayjs.extend(utc)
dayjs.extend(timezone)
dayjs.extend(customParseFormat)

const languages = { en: 'english', id: 'indonesia' }
const cookies = {}
const timeout = 30000

module.exports = {
  site: 'mncvision.id',
  days: 2,
  url: 'https://www.mncvision.id/schedule/table',
  request: {
    method: 'POST',
    data({ channel, date }) {
      const formData = new URLSearchParams()
      formData.append('search_model', 'channel')
      formData.append('af0rmelement', 'aformelement')
      formData.append('fdate', date.format('YYYY-MM-DD'))
      formData.append('fchannel', channel.site_id)
      formData.append('submit', 'Search')

      return formData
    },
    async headers({ channel }) {
      const headers = {
        'Content-Type': 'application/x-www-form-urlencoded'
      }
      if (channel) {
        if (!cookies[channel.lang]) {
          cookies[channel.lang] = await loadLangCookies(channel)
        }
        if (cookies[channel.lang]) {
          headers.Cookie = cookies[channel.lang]
        }
      }
      return headers
    },
    jar: null
  },
  async parser({ content, headers, date, channel }) {
    const programs = []

    if (!cookies[channel.lang]) {
      cookies[channel.lang] = parseCookies(headers)
    }
    const [$, items] = parseItems(content)
    for (const item of items) {
      const $item = $(item)
      const start = parseStart($item, date)
      const duration = parseDuration($item)
      const stop = start.add(duration, 'm')
      const description = await loadDescription($item, cookies[channel.lang])
      programs.push({
        title: parseTitle($item),
        season: parseSeason($item),
        episode: parseEpisode($item),
        description,
        start,
        stop
      })
    }

    return programs
  },
  async channels({ lang = 'id' }) {
    const axios = require('axios')
    const cheerio = require('cheerio')
    const result = await axios
      .get('https://www.mncvision.id/schedule')
      .then(response => response.data)
      .catch(console.error)

    const $ = cheerio.load(result)
    const items = $('select[name="fchannel"] option').toArray()
    const channels = items.map(item => {
      const $item = $(item)

      return {
        lang,
        site_id: $item.attr('value'),
        name: $item.text().split(' - ')[0].trim()
      }
    })

    return channels
  }
}

function parseSeason($item) {
  const title = parseTitle($item)
  const [, season] = title.match(/ S(\d+)/) || [null, null]

  return season ? parseInt(season) : null
}

function parseEpisode($item) {
  const title = parseTitle($item)
  const [, episode] = title.match(/ Ep (\d+)/) || [null, null]

  return episode ? parseInt(episode) : null
}

function parseDuration($item) {
  let duration = $item.find('td:nth-child(3)').text()
  const match = duration.match(/(\d{2}):(\d{2})/)
  const hours = parseInt(match[1])
  const minutes = parseInt(match[2])

  return hours * 60 + minutes
}

function parseStart($item, date) {
  let time = $item.find('td:nth-child(1)').text()
  time = `${date.format('DD/MM/YYYY')} ${time}`

  return dayjs.tz(time, 'DD/MM/YYYY HH:mm', 'Asia/Jakarta')
}

function parseTitle($item) {
  return $item.find('td:nth-child(2) > a').text()
}

function parseItems(content) {
  const $ = cheerio.load(content)

  return [$, $('tr[valign="top"]').toArray()]
}

function loadLangCookies(channel) {
  const url = `https://www.mncvision.id/language_switcher/setlang/${languages[channel.lang]}/`

  return axios
    .get(url, { timeout })
    .then(r => parseCookies(r.headers))
    .catch(error => console.error(error.message))
}

async function loadDescription($item, cookies) {
  const url = $item.find('a').attr('href')
  if (!url) return null
  const content = await axios
    .get(url, {
      headers: { 'X-Requested-With': 'XMLHttpRequest', Cookie: cookies },
      timeout
    })
    .then(r => r.data)
    .catch(error => console.error(error.message))
  if (!content) return null

  const $page = cheerio.load(content)
  const description = $page('.synopsis').text().trim()

  return description !== '-' ? description : null
}

function parseCookies(headers) {
  const cookies = []
  if (Array.isArray(headers['set-cookie'])) {
    headers['set-cookie'].forEach(cookie => {
      cookies.push(cookie.split('; ')[0])
    })
  }
  return cookies.length ? cookies.join('; ') : null
}
