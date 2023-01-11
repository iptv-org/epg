const _ = require('lodash')
const axios = require('axios')
const cheerio = require('cheerio')
const dayjs = require('dayjs')
const utc = require('dayjs/plugin/utc')
const timezone = require('dayjs/plugin/timezone')
const customParseFormat = require('dayjs/plugin/customParseFormat')

dayjs.extend(utc)
dayjs.extend(timezone)
dayjs.extend(customParseFormat)

module.exports = {
  site: 'mncvision.id',
  days: 2,
  url: 'https://mncvision.id/schedule/table',
  request: {
    method: 'POST',
    data: function ({ channel, date }) {
      const formData = new URLSearchParams()
      formData.append('search_model', 'channel')
      formData.append('af0rmelement', 'aformelement')
      formData.append('fdate', date.format('YYYY-MM-DD'))
      formData.append('fchannel', channel.site_id)
      formData.append('submit', 'Search')

      return formData
    },
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded'
    },
    jar: null
  },
  async parser({ content, date, headers, channel }) {
    const programs = []
    const cookies = parseCookies(headers)
    if (!cookies) return programs
    let items = parseItems(content)
    if (!items.length) return programs

    const pages = parsePages(content)
    for (let url of pages) {
      items = items.concat(parseItems(await loadNextPage(url, cookies)))
    }

    const langCookies = await loadLangCookies(channel)
    if (!langCookies) return programs

    for (const item of items) {
      const $item = cheerio.load(item)
      const start = parseStart($item, date)
      const duration = parseDuration($item)
      const stop = start.add(duration, 'm')
      const description = await loadDescription($item, langCookies)
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
  async channels() {
    const data = await axios
      .get('https://www.mncvision.id/schedule')
      .then(response => response.data)
      .catch(console.error)

    const $ = cheerio.load(data)
    const items = $('select[name="fchannel"] option').toArray()
    const channels = items.map(item => {
      const $item = cheerio.load(item)

      return {
        lang: 'id',
        site_id: $item('*').attr('value'),
        name: $item('*').text()
      }
    })

    return channels
  }
}

function parseSeason($item) {
  const title = parseTitle($item)
  const [_, season] = title.match(/ S(\d+)/) || [null, null]

  return season ? parseInt(season) : null
}

function parseEpisode($item) {
  const title = parseTitle($item)
  const [_, episode] = title.match(/ Ep (\d+)/) || [null, null]

  return episode ? parseInt(episode) : null
}

function parseDuration($item) {
  let duration = $item('td:nth-child(3)').text()
  const match = duration.match(/(\d{2}):(\d{2})/)
  const hours = parseInt(match[1])
  const minutes = parseInt(match[2])

  return hours * 60 + minutes
}

function parseStart($item, date) {
  let time = $item('td:nth-child(1)').text()
  time = `${date.format('DD/MM/YYYY')} ${time}`

  return dayjs.tz(time, 'DD/MM/YYYY HH:mm', 'Asia/Jakarta')
}

function parseTitle($item) {
  return $item('td:nth-child(2) > a').text()
}

function parseItems(content) {
  const $ = cheerio.load(content)

  return $('tr[valign="top"]').toArray()
}

function parsePages(content) {
  const $ = cheerio.load(content)
  const links = $('#schedule > div.schedule_search_result_container > div.box.well > a')
    .map((i, el) => {
      return $(el).attr('href')
    })
    .get()

  return _.uniq(links)
}

function loadNextPage(url, cookies) {
  return axios
    .get(url, { headers: { Cookie: cookies }, timeout: 30000 })
    .then(r => r.data)
    .catch(err => {
      console.log(err.message)

      return null
    })
}

function loadLangCookies(channel) {
  const languages = {
    en: 'english',
    id: 'indonesia'
  }
  const url = `https://www.mncvision.id/language_switcher/setlang/${languages[channel.lang]}/`

  return axios
    .get(url, { timeout: 30000 })
    .then(r => parseCookies(r.headers))
    .catch(err => null)
}

async function loadDescription($item, cookies) {
  const url = $item('a').attr('href')
  if (!url) return null
  const content = await axios
    .get(url, {
      headers: { 'X-Requested-With': 'XMLHttpRequest', Cookie: cookies },
      timeout: 30000
    })
    .then(r => r.data)
    .catch(err => null)
  if (!content) return null

  const $page = cheerio.load(content)
  const description = $page('.synopsis').text().trim()

  return description !== '-' ? description : null
}

function parseCookies(headers) {
  return Array.isArray(headers['set-cookie']) ? headers['set-cookie'].join(';') : null
}
