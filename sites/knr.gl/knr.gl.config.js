const cheerio = require('cheerio')
const dayjs = require('dayjs')
const utc = require('dayjs/plugin/utc')
const timezone = require('dayjs/plugin/timezone')
const customParseFormat = require('dayjs/plugin/customParseFormat')

dayjs.extend(utc)
dayjs.extend(timezone)
dayjs.extend(customParseFormat)

module.exports = {
  site: 'knr.gl',
  days: 2,
  url({ date }) {
    return `https://knr.gl/admin/knr/TV/program/${date.format('YYYY-MM-DD')}/gl`
  },
  parser({ content, date }) {
    let programs = []
    const items = parseItems(content)
    items.forEach(item => {
      const prev = programs[programs.length - 1]
      const start = parseStart(item, date)
      const stop = start.add(1, 'h')
      if (prev) prev.stop = start
      programs.push({
        title: item.title,
        description: item.description,
        start,
        stop
      })
    })

    return programs
  }
}

function parseStart(item, date) {
  const time = `${date.format('YYYY-MM-DD')} ${item.time}`

  return dayjs.tz(time, 'YYYY-MM-DD HH:mm', 'America/Godthab')
}

function parseItems(content, date) {
  const data = JSON.parse(content)
  if (!data.program_list) return []
  const $ = cheerio.load(data.program_list)
  const items = []
  $('dt').each(function () {
    const titleElem = $(this)
      .contents()
      .filter(function () {
        return this.nodeType === 3
      })[0]
    items.push({
      title: titleElem.nodeValue.trim(),
      description: $(this)
        .next('dd')
        .text()
        .replace(/(\r\n|\n|\r)/gm, ' '),
      time: $(this, 'strong').text().trim()
    })
  })

  return items
}
