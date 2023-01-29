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
  site: 'nos.pt',
  days: 2,
  url({ channel }) {
    return `https://www.nos.pt/particulares/televisao/guia-tv/Pages/channel.aspx?channel=${channel.site_id}`
  },
  async parser({ content, date }) {
    const programs = []
    const items = parseItems(content, date)
    date = date.subtract(1, 'd')
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
      let stop = parseStop($item, date)
      if (stop.isBefore(start)) {
        stop = stop.add(1, 'd')
        date = date.add(1, 'd')
      }
      const channelAcronym = parseChannelAcronym(content)
      const programId = parseProgramId($item)
      const details = await loadProgramDetails(channelAcronym, programId)
      programs.push({
        title: parseTitle($item),
        description: details.description,
        icon: details.icon,
        start,
        stop
      })
    }

    return programs
  },
  async channels({ country }) {
    const html = await axios
      .get(`https://www.nos.pt/particulares/televisao/guia-tv/Pages/default.aspx`)
      .then(r => r.data)
      .catch(console.log)

    const $ = cheerio.load(html)
    const items = $('#guide-filters > dl.dropdown-ord > dd > ul > li').toArray()

    return items.map(item => {
      const $item = cheerio.load(item)

      return {
        lang: 'pt',
        site_id: $item('.value').text().trim(),
        name: $item('a').clone().children().remove().end().text().trim()
      }
    })
  }
}

async function loadProgramDetails(channelAcronym, programId) {
  if (!channelAcronym || !programId) return {}
  const data = await axios
    .post(
      `https://www.nos.pt/_layouts/15/Armstrong/ApplicationPages/EPGGetProgramsAndDetails.aspx/GetProgramDetails`,
      {
        programId,
        channelAcronym,
        hour: 'undefined',
        startHour: 'undefined',
        endHour: 'undefined'
      },
      {
        headers: {
          'content-type': 'application/json; charset=UTF-8'
        }
      }
    )
    .then(r => r.data)
    .catch(console.log)

  if (!data) return {}

  const [, description, iconFilename] = data.d.split('_#|$_')
  const icon = iconFilename ? `https://images.nos.pt/${iconFilename}` : null

  return {
    description,
    icon
  }
}

function parseProgramId($item) {
  return $item('a').attr('id')
}

function parseChannelAcronym(content) {
  const $ = cheerio.load(content)

  return $('#channel-logo > img').attr('alt')
}

function parseTitle($item) {
  return $item('a').attr('title').trim()
}

function parseStart($item, date) {
  const [time] = $item('.duration')
    .text()
    .replace(/\s+/g, ' ')
    .trim()
    .match(/^\d{2}:\d{2}/) || [null]

  if (!time) return null

  return dayjs.tz(`${date.format('YYYY-MM-DD')} ${time}`, 'YYYY-MM-DD HH:mm', 'Europe/Lisbon')
}

function parseStop($item, date) {
  const [time] = $item('.duration')
    .text()
    .replace(/\s+/g, ' ')
    .trim()
    .match(/\d{2}:\d{2}$/) || [null]

  if (!time) return null

  return dayjs.tz(`${date.format('YYYY-MM-DD')} ${time}`, 'YYYY-MM-DD HH:mm', 'Europe/Lisbon')
}

function parseItems(content, date) {
  const day = date.date()
  const $ = cheerio.load(content)

  return $(`#day${day} > ul > li`).toArray()
}
