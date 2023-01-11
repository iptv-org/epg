const dayjs = require('dayjs')
const axios = require('axios')
const cheerio = require('cheerio')
const utc = require('dayjs/plugin/utc')
const customParseFormat = require('dayjs/plugin/customParseFormat')

dayjs.extend(utc)
dayjs.extend(customParseFormat)

module.exports = {
  site: 'tv24.se',
  days: 2,
  url: function ({ channel, date }) {
    return `https://tv24.se/x/channel/${channel.site_id}/0/${date.format('YYYY-MM-DD')}`
  },
  parser: async function ({ content, date }) {
    let programs = []
    const items = parseItems(content)
    for (let item of items) {
      const prev = programs[programs.length - 1]
      const $item = cheerio.load(item)
      let start = parseStart($item, date)
      if (prev) {
        if (start.isBefore(prev.start)) {
          start = start.add(1, 'd')
          date = date.add(1, 'd')
        }
        prev.stop = start
      }
      const stop = start.add(30, 'm')
      const details = await loadProgramDetails($item)
      programs.push({
        title: parseTitle($item),
        description: details.description,
        actors: details.actors,
        icon: details.icon,
        category: details.category,
        sub_title: details.sub_title,
        season: details.season,
        episode: details.episode,
        start,
        stop
      })
    }

    return programs
  },
  async channels() {
    let html = await axios
      .get(`https://tv24.se/x/settings/addremove`)
      .then(r => r.data)
      .catch(console.log)
    let $ = cheerio.load(html)
    const nums = $('li')
      .toArray()
      .map(item => $(item).data('channel'))
    html = await axios
      .get(`https://tv24.se`, {
        headers: {
          Cookie: `selectedChannels=${nums.join(',')}`
        }
      })
      .then(r => r.data)
      .catch(console.log)
    $ = cheerio.load(html)
    const items = $('li.c').toArray()

    return items.map(item => {
      const name = $(item).find('h3').text().trim()
      const link = $(item).find('.channel').attr('href')
      const [_, site_id] = link.match(/\/kanal\/(.*)/) || [null, null]

      return {
        lang: 'sv',
        site_id,
        name
      }
    })
  }
}

async function loadProgramDetails($item) {
  const programId = $item('a').attr('href')
  const data = await axios
    .get(`https://tv24.se/x${programId}/0/0`)
    .then(r => r.data)
    .catch(console.error)
  if (!data) return Promise.resolve({})
  const $ = cheerio.load(data.contentBefore + data.contentAfter)

  return Promise.resolve({
    icon: parseIcon($),
    actors: parseActors($),
    description: parseDescription($),
    category: parseCategory($),
    sub_title: parseSubTitle($),
    season: parseSeason($),
    episode: parseEpisode($)
  })
}

function parseIcon($) {
  const style = $('.image > .actual').attr('style')
  const [_, url] = style.match(/background-image\: url\('([^']+)'\)/)

  return url
}

function parseSeason($) {
  const [_, season] = $('.sub-title')
    .text()
    .trim()
    .match(/Säsong (\d+)/) || [null, '']

  return parseInt(season)
}

function parseEpisode($) {
  const [_, episode] = $('.sub-title')
    .text()
    .trim()
    .match(/Avsnitt (\d+)/) || [null, '']

  return parseInt(episode)
}

function parseSubTitle($) {
  const [_, subtitle] = $('.sub-title').text().trim().split(': ')

  return subtitle
}

function parseCategory($) {
  return $('.extras > dt:contains(Kategori)').next().text().trim().split(' / ')
}

function parseActors($) {
  return $('.cast > li')
    .map((i, el) => {
      return $(el).find('.name').text().trim()
    })
    .get()
}

function parseDescription($) {
  return $('.info > p').text().trim()
}

function parseTitle($item) {
  return $item('h3').text()
}

function parseStart($item, date) {
  const time = $item('.time')

  return dayjs.utc(`${date.format('YYYY-MM-DD')} ${time}`, 'YYYY-MM-DD HH:mm')
}

function parseItems(content) {
  const $ = cheerio.load(content)

  return $('.program').toArray()
}
